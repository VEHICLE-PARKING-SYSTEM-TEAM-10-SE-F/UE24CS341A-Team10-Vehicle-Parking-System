const mongoose = require('mongoose');
const { VEHICLE_TYPES } = require('./constants');

// SRS Appendix B.5: one hourly rate per vehicle type, stored in paise.
const feeRateSchema = new mongoose.Schema({
  vehicleType: { type: String, required: true, unique: true, enum: VEHICLE_TYPES },
  hourlyRatePaise: { type: Number, required: true, min: 0 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('FeeRate', feeRateSchema);
