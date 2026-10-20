const FeeRate = require('../models/FeeRate');
const AppError = require('../utils/AppError');
const { VEHICLE_TYPES } = require('../models/constants');

// FR-16 / BR-04: fixed grace period of 15 minutes.
const GRACE_MINUTES = 15;

// Pure fee rule (FR-16): billable hours = duration minus 15 minutes, rounded up to the
// next whole hour; fee = billable hours x hourly rate; 0 if the duration is 15 minutes or less.
function computeFee(durationMinutes, hourlyRatePaise) {
  if (durationMinutes <= GRACE_MINUTES) return { billableHours: 0, feePaise: 0 };
  const billableHours = Math.ceil((durationMinutes - GRACE_MINUTES) / 60);
  return { billableHours, feePaise: billableHours * hourlyRatePaise };
}

// Uses the rate in force when the exit is recorded (FR-19: a changed rate applies only to later exits).
async function calculate(vehicleType, entryTime, exitTime) {
  const rate = await FeeRate.findOne({ vehicleType });
  if (!rate) {
    throw new AppError(409, 'RATE_NOT_CONFIGURED', 'No hourly rate is set for this vehicle type. Ask the Administrator to set it.');
  }
  const durationMinutes = (exitTime - entryTime) / 60000;
  return { durationMinutes, hourlyRatePaise: rate.hourlyRatePaise, ...computeFee(durationMinutes, rate.hourlyRatePaise) };
}

const rupees = (paise) => (paise === null || paise === undefined ? null : (paise / 100).toFixed(2));

async function listRates() {
  const rates = await FeeRate.find();
  const byType = Object.fromEntries(rates.map((r) => [r.vehicleType, r]));
  return {
    graceMinutes: GRACE_MINUTES,
    rates: VEHICLE_TYPES.map((t) => ({
      vehicleType: t,
      hourlyRate: byType[t] ? rupees(byType[t].hourlyRatePaise) : null,
      updatedAt: byType[t] ? byType[t].updatedAt : null,
    })),
  };
}

// FR-19: the Administrator sets the hourly rate (Rs, >= 0) per vehicle type. The rate is read
// when an exit is recorded, so a change applies only to exits recorded after it; Completed
// records keep the fee stored on them.
async function setRates(rates, userId) {
  for (const { vehicleType, hourlyRate } of rates) {
    await FeeRate.updateOne(
      { vehicleType },
      { $set: { hourlyRatePaise: Math.round(hourlyRate * 100), updatedBy: userId } },
      { upsert: true },
    );
  }
  return listRates();
}

module.exports = { GRACE_MINUTES, computeFee, calculate, rupees, listRates, setRates };
