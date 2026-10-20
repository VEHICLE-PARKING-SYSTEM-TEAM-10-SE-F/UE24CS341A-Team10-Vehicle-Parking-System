// NFR-04 / BR-01: two entries race for the last slot - exactly one wins, every time (TC-CONC-01).
const request = require('supertest');
const { createApp } = require('../src/app');
const ParkingRecord = require('../src/models/ParkingRecord');
const Slot = require('../src/models/Slot');
const Vehicle = require('../src/models/Vehicle');
const Counter = require('../src/models/Counter');
const { startDb, clearDb, stopDb } = require('./helpers/db');
const { createUser, loginAs } = require('./helpers/auth');
const { addSlots, addVehicle } = require('./helpers/fixtures');

const app = createApp();
const RUNS = 50;
let token;

beforeAll(async () => {
  await startDb();
  await clearDb();
  await createUser('att1', 'ATTENDANT');
  token = await loginAs(app, 'att1');
});
afterAll(stopDb);

const enter = (regNo) => request(app).post('/api/v1/parking/entry').set('Authorization', `Bearer ${token}`).send({ regNo });

it(`exactly one of two simultaneous entries gets the last Car slot, in ${RUNS} runs`, async () => {
  for (let run = 0; run < RUNS; run += 1) {
    await Promise.all([ParkingRecord.deleteMany({}), Slot.deleteMany({}), Vehicle.deleteMany({}), Counter.deleteMany({})]);
    await addSlots('CAR', ['A-01']);
    await addVehicle('KA01AB1234', 'CAR');
    await addVehicle('KA02CD5678', 'CAR');

    const results = await Promise.all([enter('KA01AB1234'), enter('KA02CD5678')]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409]);
    const loser = results.find((r) => r.status === 409);
    expect(['SLOT_CONFLICT_RETRY', 'NO_SLOT_AVAILABLE']).toContain(loser.body.error.code);
    expect(await ParkingRecord.countDocuments({ slotId: 'A-01', status: 'ACTIVE' })).toBe(1);
  }
}, 180000);

it('the database itself refuses a second Active record for the same slot', async () => {
  await Promise.all([ParkingRecord.deleteMany({}), Vehicle.deleteMany({})]);
  const a = await addVehicle('KA01AB1234', 'CAR');
  const b = await addVehicle('KA02CD5678', 'CAR');
  const base = { regNo: 'X', vehicleType: 'CAR', slotId: 'A-01', entryTime: new Date(), status: 'ACTIVE', recordedBy: a._id };
  await ParkingRecord.create({ ...base, ticketNo: 'T-1', vehicleId: a._id });
  await expect(ParkingRecord.create({ ...base, ticketNo: 'T-2', vehicleId: b._id })).rejects.toMatchObject({ code: 11000 });
});
