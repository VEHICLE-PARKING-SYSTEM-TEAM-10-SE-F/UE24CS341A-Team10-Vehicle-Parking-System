const mongoose = require('mongoose');
const { VEHICLE_TYPES } = require('./constants');

// SRS Appendix B.1. Registration numbers are stored in upper case (FR-06).
const vehicleSchema = new mongoose.Schema({
  regNo: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 15 },
  vehicleType: { type: String, required: true, enum: VEHICLE_TYPES },
  ownerContact: { type: String, trim: true, maxlength: 15 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
