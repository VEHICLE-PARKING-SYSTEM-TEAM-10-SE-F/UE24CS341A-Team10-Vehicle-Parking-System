const mongoose = require('mongoose');
const ParkingRecord = require('../models/ParkingRecord');
const Counter = require('../models/Counter');
const AppError = require('../utils/AppError');
const vehicleService = require('./vehicleService');
const slotService = require('./slotService');
const feeService = require('./feeService');
const { RECORD_STATUS } = require('../models/constants');

const IST_OFFSET_MS = 330 * 60 * 1000;

// Ticket numbers like T-20261019-0042: date in IST plus a per-day sequence.
async function nextTicketNo(now, session) {
  const day = new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10).replace(/-/g, '');
  const counter = await Counter.findOneAndUpdate(
    { _id: `ticket-${day}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session },
  );
  return `T-${day}-${String(counter.seq).padStart(4, '0')}`;
}

function isConcurrencyError(err) {
  return err.code === 11000 || err.code === 112 /* WriteConflict */
    || (typeof err.hasErrorLabel === 'function' && err.hasErrorLabel('TransientTransactionError'));
}

// FR-11 – FR-14: record entry, allocate a slot, create the record with a ticket number.
// The slot change and the record are one transaction (FR-14, SAD SD-1).
async function recordEntry({ regNo, slotId }, user) {
  const vehicle = await vehicleService.findActiveByRegNo(regNo);
  if (await ParkingRecord.exists({ vehicleId: vehicle._id, status: RECORD_STATUS.ACTIVE })) {
    throw new AppError(409, 'VEHICLE_ALREADY_PARKED', `Vehicle ${vehicle.regNo} is already parked`, 'regNo');
  }

  const session = await mongoose.startSession();
  try {
    let record;
    await session.withTransaction(async () => {
      const now = new Date();
      const slot = await slotService.allocate({ vehicleType: vehicle.vehicleType, vehicleId: vehicle._id, slotId, session });
      const ticketNo = await nextTicketNo(now, session);
      [record] = await ParkingRecord.create([{
        ticketNo,
        vehicleId: vehicle._id,
        regNo: vehicle.regNo,
        vehicleType: vehicle.vehicleType,
        slotId: slot.slotId,
        entryTime: now,
        status: RECORD_STATUS.ACTIVE,
        recordedBy: user.id,
      }], { session });
    }, { writeConcern: { w: 'majority', j: true } });
    return record;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (isConcurrencyError(err)) {
      // NFR-04: the other request won - tell this one to retry.
      if (await ParkingRecord.exists({ vehicleId: vehicle._id, status: RECORD_STATUS.ACTIVE })) {
        throw new AppError(409, 'VEHICLE_ALREADY_PARKED', `Vehicle ${vehicle.regNo} is already parked`, 'regNo');
      }
      throw new AppError(409, 'SLOT_CONFLICT_RETRY', 'The slot was just taken by another entry. Please try again.');
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

async function findActiveRecord(regNo) {
  const vehicle = await vehicleService.findActiveByRegNo(regNo);
  const record = await ParkingRecord.findOne({ vehicleId: vehicle._id, status: RECORD_STATUS.ACTIVE });
  if (!record) {
    throw new AppError(404, 'NO_ACTIVE_RECORD', `No active parking record for vehicle ${vehicle.regNo}`, 'regNo');
  }
  return record;
}

// FR-15 – FR-17: record the exit time (server time), calculate the fee from the current
// hourly rate and return the summary. The record stays Active until the exit is confirmed.
async function recordExit({ regNo }) {
  const record = await findActiveRecord(regNo);
  const exitTime = new Date();
  const fee = await feeService.calculate(record.vehicleType, record.entryTime, exitTime);
  record.exitTime = exitTime;
  record.durationMin = fee.durationMinutes;
  record.feePaise = fee.feePaise;
  await record.save();
  return { record, fee };
}

async function findByTicket(ticketNo) {
  const record = await ParkingRecord.findOne({ ticketNo });
  if (!record) throw new AppError(404, 'TICKET_NOT_FOUND', `Ticket ${ticketNo} not found`, 'ticketNo');
  if (record.status === RECORD_STATUS.COMPLETED) {
    throw new AppError(409, 'ALREADY_COMPLETED', `Ticket ${ticketNo} is already completed`, 'ticketNo');
  }
  if (!record.exitTime) {
    throw new AppError(409, 'EXIT_NOT_RECORDED', 'Record the exit first to see the fee summary', 'ticketNo');
  }
  return record;
}

// FR-18: on confirmation, mark the record Completed with its fee and set the slot Available,
// in one transaction (SAD SD-2 step 2).
async function confirmExit(ticketNo) {
  const session = await mongoose.startSession();
  try {
    let completed;
    await session.withTransaction(async () => {
      const record = await findByTicket(ticketNo);
      completed = await ParkingRecord.findOneAndUpdate(
        { _id: record._id, status: RECORD_STATUS.ACTIVE },
        { $set: { status: RECORD_STATUS.COMPLETED } },
        { new: true, session },
      );
      if (!completed) throw new AppError(409, 'ALREADY_COMPLETED', `Ticket ${ticketNo} is already completed`, 'ticketNo');
      await slotService.release({ slotId: record.slotId, session });
    }, { writeConcern: { w: 'majority', j: true } });
    return completed;
  } finally {
    await session.endSession();
  }
}

// The attendant cancelled the summary: the record stays Active with no exit time.
async function cancelExit(ticketNo) {
  const record = await findByTicket(ticketNo);
  record.exitTime = null;
  record.durationMin = null;
  record.feePaise = null;
  await record.save();
  return record;
}

// FR-21: Parked (slot, entry time, elapsed duration) or Not Parked.
async function currentStatus(vehicleId) {
  const record = await ParkingRecord.findOne({ vehicleId, status: RECORD_STATUS.ACTIVE });
  if (!record) return { status: 'NOT_PARKED' };
  return {
    status: 'PARKED',
    ticketNo: record.ticketNo,
    slotId: record.slotId,
    entryTime: record.entryTime,
    elapsedMin: Math.floor((Date.now() - record.entryTime) / 60000),
  };
}

function toDto(r) {
  return {
    ticketNo: r.ticketNo,
    regNo: r.regNo,
    vehicleType: r.vehicleType,
    slotId: r.slotId,
    entryTime: r.entryTime,
    exitTime: r.exitTime,
    durationMin: r.durationMin === null ? null : Math.round(r.durationMin),
    fee: feeService.rupees(r.feePaise),
    status: r.status,
  };
}

function toSummary({ record, fee }) {
  return {
    ...toDto(record),
    billableHours: fee.billableHours,
    hourlyRate: feeService.rupees(fee.hourlyRatePaise),
    graceMinutes: feeService.GRACE_MINUTES,
  };
}

module.exports = {
  recordEntry, recordExit, confirmExit, cancelExit, currentStatus, findActiveRecord, toDto, toSummary,
};
