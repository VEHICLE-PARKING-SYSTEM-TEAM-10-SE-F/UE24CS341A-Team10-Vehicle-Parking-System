const request = require('supertest');
const { createApp } = require('../src/app');
const ParkingRecord = require('../src/models/ParkingRecord');
const Slot = require('../src/models/Slot');
const { startDb, clearDb, stopDb } = require('./helpers/db');
const { createUser, loginAs } = require('./helpers/auth');
const { addSlots, addVehicle, addDefaultRates } = require('./helpers/fixtures');

const app = createApp();
let token;

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  await createUser('att1', 'ATTENDANT');
  token = await loginAs(app, 'att1');
  await addVehicle('KA01AB1234', 'CAR');
  await addVehicle('KA02CD5678', 'CAR');
  await addVehicle('KA03EF9012', 'TWO_WHEELER');
  await addDefaultRates();
});

const entry = (body) => request(app).post('/api/v1/parking/entry').set('Authorization', `Bearer ${token}`).send(body);
const exit = (body) => request(app).post('/api/v1/parking/exit').set('Authorization', `Bearer ${token}`).send(body);

describe('FR-11, FR-12, FR-14 record entry (TC-ENT-01)', () => {
  it('allocates the lowest matching slot and creates an Active record with a ticket', async () => {
    await addSlots('CAR', ['A-04', 'A-01']);
    await addSlots('TWO_WHEELER', ['B-01']);
    const before = Date.now();
    const res = await entry({ regNo: 'ka01ab1234' });

    expect(res.status).toBe(201);
    expect(res.body.slotId).toBe('A-01');
    expect(res.body.ticketNo).toMatch(/^T-\d{8}-\d{4}$/);
    expect(new Date(res.body.entryTime).getTime()).toBeGreaterThanOrEqual(before);

    const slot = await Slot.findOne({ slotId: 'A-01' });
    expect(slot.status).toBe('OCCUPIED');
    const record = await ParkingRecord.findOne({ ticketNo: res.body.ticketNo });
    expect(record.status).toBe('ACTIVE');
    expect(record.slotId).toBe('A-01');
  });

  it('gives each entry a unique ticket number', async () => {
    await addSlots('CAR', ['A-01', 'A-02']);
    const a = await entry({ regNo: 'KA01AB1234' });
    const b = await entry({ regNo: 'KA02CD5678' });
    expect(a.body.ticketNo).not.toBe(b.body.ticketNo);
  });
});

describe('FR-11 reject entry for a vehicle that is already parked (TC-ENT-02)', () => {
  it('rejects and changes nothing', async () => {
    await addSlots('CAR', ['A-01', 'A-02']);
    await entry({ regNo: 'KA01AB1234' });
    const res = await entry({ regNo: 'KA01AB1234' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('VEHICLE_ALREADY_PARKED');
    expect(await ParkingRecord.countDocuments()).toBe(1);
    expect((await Slot.findOne({ slotId: 'A-02' })).status).toBe('AVAILABLE');
  });
});

describe('FR-13 no matching slot (TC-ENT-03)', () => {
  it('refuses with the exact SRS message and creates no record', async () => {
    await addSlots('CAR', ['A-01'], 'OCCUPIED');
    await addSlots('CAR', ['A-02'], 'UNAVAILABLE');
    await addSlots('TWO_WHEELER', ['B-01']);
    const res = await entry({ regNo: 'KA01AB1234' });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('No parking slot available for this vehicle type');
    expect(await ParkingRecord.countDocuments()).toBe(0);
  });
});

describe('FR-12 manual slot selection (TC-ENT-04)', () => {
  it('uses the slot the attendant chose', async () => {
    await addSlots('CAR', ['A-04', 'A-05']);
    const res = await entry({ regNo: 'KA01AB1234', slotId: 'a-05' });
    expect(res.status).toBe(201);
    expect(res.body.slotId).toBe('A-05');
  });

  it('rejects a slot of a different type', async () => {
    await addSlots('CAR', ['A-04']);
    await addSlots('TWO_WHEELER', ['B-01']);
    const res = await entry({ regNo: 'KA01AB1234', slotId: 'B-01' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SLOT_NOT_AVAILABLE');
    expect(await ParkingRecord.countDocuments()).toBe(0);
  });
});

it('an unregistered vehicle cannot enter', async () => {
  await addSlots('CAR', ['A-01']);
  const res = await entry({ regNo: 'KA09ZZ0000' });
  expect(res.status).toBe(404);
  expect(res.body.error.code).toBe('VEHICLE_NOT_FOUND');
});

describe('FR-15 record exit (TC-EXT-01 step 1, TC-EXT-02)', () => {
  it('stores the server exit time in the Active record', async () => {
    await addSlots('CAR', ['A-01']);
    await entry({ regNo: 'KA01AB1234' });
    const before = Date.now();
    const res = await exit({ regNo: 'KA01AB1234' });
    expect(res.status).toBe(200);
    expect(new Date(res.body.exitTime).getTime()).toBeGreaterThanOrEqual(before);
    const record = await ParkingRecord.findOne({ regNo: 'KA01AB1234' });
    expect(record.exitTime).not.toBeNull();
  });

  it('rejects exit for a vehicle without an Active record and changes nothing', async () => {
    const res = await exit({ regNo: 'KA02CD5678' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NO_ACTIVE_RECORD');
    expect(await ParkingRecord.countDocuments()).toBe(0);
  });
});
