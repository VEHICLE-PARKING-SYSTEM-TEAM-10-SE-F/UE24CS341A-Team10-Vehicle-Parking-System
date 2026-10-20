const Slot = require('../models/Slot');
const Vehicle = require('../models/Vehicle');

// FR-23: Parking Occupancy Report - each slot with its status, assigned vehicle and last
// updated time (SRS Appendix B.6), plus totals per status.
async function occupancy() {
  const slots = await Slot.find().sort({ slotId: 1 });
  const vehicleIds = slots.map((s) => s.currentVehicleId).filter(Boolean);
  const vehicles = await Vehicle.find({ _id: { $in: vehicleIds } }, { regNo: 1 });
  const regNoById = Object.fromEntries(vehicles.map((v) => [String(v._id), v.regNo]));

  const rows = slots.map((s) => ({
    slotId: s.slotId,
    slotType: s.slotType,
    status: s.status,
    assignedVehicle: s.currentVehicleId ? regNoById[String(s.currentVehicleId)] || null : null,
    lastUpdated: s.lastUpdated,
  }));
  const count = (status) => rows.filter((r) => r.status === status).length;
  return {
    generatedAt: new Date(),
    totals: { slots: rows.length, available: count('AVAILABLE'), occupied: count('OCCUPIED'), unavailable: count('UNAVAILABLE') },
    slots: rows,
  };
}

module.exports = { occupancy };
