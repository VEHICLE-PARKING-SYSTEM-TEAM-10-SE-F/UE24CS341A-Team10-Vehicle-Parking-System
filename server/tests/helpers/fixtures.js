const Slot = require('../../src/models/Slot');
const Vehicle = require('../../src/models/Vehicle');

async function addSlots(type, ids, status = 'AVAILABLE') {
  return Slot.insertMany(ids.map((slotId) => ({ slotId, slotType: type, status, lastUpdated: new Date() })));
}

async function addVehicle(regNo, vehicleType) {
  return Vehicle.create({ regNo, vehicleType });
}

module.exports = { addSlots, addVehicle };
