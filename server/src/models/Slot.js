const mongoose = require('mongoose');
const { VEHICLE_TYPES, SLOT_STATUS } = require('./constants');

// SRS Appendix B.2.
const slotSchema = new mongoose.Schema({
  slotId: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 12 },
  slotType: { type: String, required: true, enum: VEHICLE_TYPES },
  status: { type: String, required: true, enum: Object.values(SLOT_STATUS), default: SLOT_STATUS.AVAILABLE },
  currentVehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
  lastUpdated: { type: Date, required: true, default: Date.now },
});

// Allocation looks up the lowest Available slot of a type (FR-12).
slotSchema.index({ slotType: 1, status: 1, slotId: 1 });

module.exports = mongoose.model('Slot', slotSchema);
