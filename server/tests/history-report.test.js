// FR-22 parking history (TC-SRCH-03) and FR-23 Parking Occupancy Report (TC-REP-01).
const request = require('supertest');
const { createApp } = require('../src/app');
const ParkingRecord = require('../src/models/ParkingRecord');
const Slot = require('../src/models/Slot');
const { startDb, clearDb, stopDb } = require('./helpers/db');
const { createUser, loginAs } = require('./helpers/auth');
const { addSlots, addVehicle, addDefaultRates } = require('./helpers/fixtures');

const app = createApp();
let admin;
let att;

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  await createUser('admin1', 'ADMIN');
  await createUser('att1', 'ATTENDANT');
  admin = await loginAs(app, 'admin1');
  att = await loginAs(app, 'att1');
  await addDefaultRates();
});

const as = (token) => (method, path, body) => request(app)[method](`/api/v1${path}`).set('Authorization', `Bearer ${token}`).send(body);

describe('TC-SRCH-03 parking history of a vehicle', () => {
  it('shows each completed visit with entry, exit, Slot ID and fee, most recent first', async () => {
    await addSlots('CAR', ['A-01', 'A-02', 'A-03']);
    const v = await addVehicle('KA01AB1234', 'CAR');
    const user = await createUser('rec1', 'ATTENDANT');
    const day = 24 * 3600 * 1000;
    const now = Date.now();
    await ParkingRecord.insertMany([3, 2, 1].map((daysAgo, i) => ({
      ticketNo: `T-2026101${i}-000${i}`, vehicleId: v._id, regNo: 'KA01AB1234', vehicleType: 'CAR', slotId: `A-0${i + 1}`,
      entryTime: new Date(now - daysAgo * day), exitTime: new Date(now - daysAgo * day + 90 * 60000),
      durationMin: 90, feePaise: 6000, status: 'COMPLETED', recordedBy: user._id,
    })));

    const res = await as(att)('get', '/vehicles/search?regNo=KA01AB1234');
    expect(res.status).toBe(200);
    expect(res.body.history).toHaveLength(3);
    expect(res.body.history.map((h) => h.slotId)).toEqual(['A-03', 'A-02', 'A-01']);
    expect(res.body.history[0]).toMatchObject({ durationMin: 90, fee: '60.00' });
    expect(res.body.history[0].entryTime).toBeTruthy();
    expect(res.body.history[0].exitTime).toBeTruthy();
  });

  it('an active (not yet completed) visit is not part of the history', async () => {
    await addSlots('CAR', ['A-01']);
    await addVehicle('KA01AB1234', 'CAR');
    await as(att)('post', '/parking/entry', { regNo: 'KA01AB1234' });
    const res = await as(att)('get', '/vehicles/search?regNo=KA01AB1234');
    expect(res.body.history).toEqual([]);
    expect(res.body.current.status).toBe('PARKED');
  });
});

describe('TC-REP-01 parking occupancy report', () => {
  it('lists each slot with status, assigned vehicle and last updated time, matching the database', async () => {
    await addSlots('CAR', ['A-01', 'A-02']);
    await addSlots('CAR', ['A-03'], 'UNAVAILABLE');
    await addVehicle('KA01AB1234', 'CAR');
    await as(att)('post', '/parking/entry', { regNo: 'KA01AB1234' });

    const res = await as(admin)('get', '/reports/occupancy');
    expect(res.status).toBe(200);
    expect(res.body.totals).toEqual({ slots: 3, available: 1, occupied: 1, unavailable: 1 });
    const a1 = res.body.slots.find((s) => s.slotId === 'A-01');
    expect(a1).toMatchObject({ status: 'OCCUPIED', assignedVehicle: 'KA01AB1234' });
    expect(res.body.slots.find((s) => s.slotId === 'A-02').assignedVehicle).toBeNull();

    const db = await Slot.find().sort({ slotId: 1 }).lean();
    expect(res.body.slots.map((s) => [s.slotId, s.status])).toEqual(db.map((s) => [s.slotId, s.status]));
    expect(new Date(a1.lastUpdated).getTime()).toBe(db[0].lastUpdated.getTime());
  });

  it('an attendant request is denied (403)', async () => {
    const res = await as(att)('get', '/reports/occupancy');
    expect(res.status).toBe(403);
    expect(res.body.slots).toBeUndefined();
  });
});
