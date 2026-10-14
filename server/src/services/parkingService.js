const mongoose = require('mongoose');
const ParkingRecord = require('../models/ParkingRecord');
const Counter = require('../models/Counter');
const AppError = require('../utils/AppError');
const vehicleService = require('./vehicleService');
const slotService = require('./slotService');
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

// FR-15: record the exit time (server time) in the vehicle's Active record.
// The record stays Active until the attendant confirms the exit.
async function recordExit({ regNo }) {
  const record = await findActiveRecord(regNo);
  const exitTime = new Date();
  record.exitTime = exitTime;
  record.durationMin = (exitTime - record.entryTime) / 60000;
  await record.save();
  return record;
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
    status: r.status,
  };
}

module.exports = { recordEntry, recordExit, findActiveRecord, toDto };
