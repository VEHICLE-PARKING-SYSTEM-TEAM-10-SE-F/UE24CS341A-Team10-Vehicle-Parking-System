const Slot = require('../../src/models/Slot');
const Vehicle = require('../../src/models/Vehicle');
const FeeRate = require('../../src/models/FeeRate');

async function addSlots(type, ids, status = 'AVAILABLE') {
  return Slot.insertMany(ids.map((slotId) => ({ slotId, slotType: type, status, lastUpdated: new Date() })));
}

async function addVehicle(regNo, vehicleType) {
  return Vehicle.create({ regNo, vehicleType });
}

// STP Appendix A default rates: Two-wheeler Rs 10, Car Rs 30, Other Rs 50 per hour.
async function addDefaultRates() {
  return FeeRate.insertMany([
    { vehicleType: 'TWO_WHEELER', hourlyRatePaise: 1000 },
    { vehicleType: 'CAR', hourlyRatePaise: 3000 },
    { vehicleType: 'OTHER', hourlyRatePaise: 5000 },
  ]);
}

module.exports = { addSlots, addVehicle, addDefaultRates };
