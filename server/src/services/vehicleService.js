const Vehicle = require('../models/Vehicle');
const AppError = require('../utils/AppError');

function normaliseRegNo(regNo) {
  return String(regNo).trim().toUpperCase();
}

// FR-06 register a vehicle; FR-07 reject duplicates and name the field.
async function register({ regNo, vehicleType, ownerContact }) {
  const normalised = normaliseRegNo(regNo);
  if (await Vehicle.exists({ regNo: normalised })) {
    throw new AppError(409, 'DUPLICATE_REG_NO', `Registration number ${normalised} is already registered`, 'regNo');
  }
  try {
    return await Vehicle.create({ regNo: normalised, vehicleType, ownerContact: ownerContact || undefined });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(409, 'DUPLICATE_REG_NO', `Registration number ${normalised} is already registered`, 'regNo');
    }
    throw err;
  }
}

async function findActiveByRegNo(regNo) {
  const vehicle = await Vehicle.findOne({ regNo: normaliseRegNo(regNo), active: true });
  if (!vehicle) throw new AppError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found', 'regNo');
  return vehicle;
}

function toDto(v) {
  return { vehicleId: String(v._id), regNo: v.regNo, vehicleType: v.vehicleType, ownerContact: v.ownerContact || null };
}

module.exports = { register, findActiveByRegNo, normaliseRegNo, toDto };
