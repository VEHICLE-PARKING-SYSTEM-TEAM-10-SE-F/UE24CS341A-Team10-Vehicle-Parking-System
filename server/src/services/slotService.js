const Slot = require('../models/Slot');
const AppError = require('../utils/AppError');
const { SLOT_STATUS } = require('../models/constants');

// FR-08: add a slot; it starts Available. Duplicate Slot IDs are rejected.
async function createSlot({ slotId, slotType }) {
  const id = String(slotId).trim().toUpperCase();
  if (await Slot.exists({ slotId: id })) {
    throw new AppError(409, 'DUPLICATE_SLOT_ID', `Slot ${id} already exists`, 'slotId');
  }
  try {
    return await Slot.create({ slotId: id, slotType, status: SLOT_STATUS.AVAILABLE, lastUpdated: new Date() });
  } catch (err) {
    if (err.code === 11000) throw new AppError(409, 'DUPLICATE_SLOT_ID', `Slot ${id} already exists`, 'slotId');
    throw err;
  }
}

// FR-12 / BR-02: atomically switch one Available slot of the right type to Occupied.
// Without slotId: the lowest Slot ID. With slotId: that slot, if it is Available and the right type.
async function allocate({ vehicleType, vehicleId, slotId, session }) {
  const filter = { slotType: vehicleType, status: SLOT_STATUS.AVAILABLE };
  if (slotId) filter.slotId = String(slotId).trim().toUpperCase();
  const slot = await Slot.findOneAndUpdate(
    filter,
    { $set: { status: SLOT_STATUS.OCCUPIED, currentVehicleId: vehicleId, lastUpdated: new Date() } },
    { sort: { slotId: 1 }, new: true, session },
  );
  if (!slot) {
    if (slotId) {
      throw new AppError(409, 'SLOT_NOT_AVAILABLE', `Slot ${filter.slotId} is not an Available slot for this vehicle type`, 'slotId');
    }
    // FR-13: exact message from the SRS.
    throw new AppError(409, 'NO_SLOT_AVAILABLE', 'No parking slot available for this vehicle type');
  }
  return slot;
}

// FR-18: set the slot back to Available when the exit is confirmed.
async function release({ slotId, session }) {
  await Slot.updateOne(
    { slotId, status: SLOT_STATUS.OCCUPIED },
    { $set: { status: SLOT_STATUS.AVAILABLE, currentVehicleId: null, lastUpdated: new Date() } },
    { session },
  );
}

function listSlots() {
  return Slot.find().sort({ slotId: 1 });
}

// FR-10: counts per slot type.
async function summary() {
  const rows = await Slot.aggregate([{ $group: { _id: { type: '$slotType', status: '$status' }, n: { $sum: 1 } } }]);
  const byType = {};
  for (const { _id, n } of rows) {
    byType[_id.type] = byType[_id.type] || { slotType: _id.type, total: 0, available: 0, occupied: 0, unavailable: 0 };
    byType[_id.type].total += n;
    byType[_id.type][_id.status.toLowerCase()] += n;
  }
  const list = Object.values(byType).sort((a, b) => a.slotType.localeCompare(b.slotType));
  return { total: list.reduce((t, x) => t + x.total, 0), byType: list };
}

function toDto(s) {
  return { slotId: s.slotId, slotType: s.slotType, status: s.status, lastUpdated: s.lastUpdated };
}

module.exports = { createSlot, allocate, release, listSlots, summary, toDto };
