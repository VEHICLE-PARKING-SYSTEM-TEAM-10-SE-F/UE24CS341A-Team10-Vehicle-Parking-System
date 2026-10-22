const mongoose = require('mongoose');
const { RECORD_STATUS, VEHICLE_TYPES } = require('./constants');

// SRS Appendix B.3. Fees are stored in paise (integer) to avoid rounding errors.
const recordSchema = new mongoose.Schema({
  ticketNo: { type: String, required: true, unique: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  regNo: { type: String, required: true },
  vehicleType: { type: String, required: true, enum: VEHICLE_TYPES },
  slotId: { type: String, required: true },
  entryTime: { type: Date, required: true },
  exitTime: { type: Date, default: null },
  durationMin: { type: Number, default: null },
  feePaise: { type: Number, default: null },
  status: { type: String, required: true, enum: Object.values(RECORD_STATUS), default: RECORD_STATUS.ACTIVE },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// BR-03: a vehicle has at most one Active record. BR-01: a slot has at most one Active record.
// Enforced by the database too, so concurrent requests can't break them (NFR-04, SAD ADR-02).
const active = { partialFilterExpression: { status: RECORD_STATUS.ACTIVE }, unique: true };
recordSchema.index({ vehicleId: 1 }, { ...active, name: 'one_active_record_per_vehicle' });
recordSchema.index({ slotId: 1 }, { ...active, name: 'one_active_record_per_slot' });
recordSchema.index({ vehicleId: 1, entryTime: -1 });

module.exports = mongoose.model('ParkingRecord', recordSchema);
