// FR-10 slot availability (TC-SLOT-03); FR-20, FR-21 search and current status (TC-SRCH-01, TC-SRCH-02).
const request = require('supertest');
const { createApp } = require('../src/app');
const { startDb, clearDb, stopDb } = require('./helpers/db');
const { createUser, loginAs } = require('./helpers/auth');
const { addSlots, addVehicle, addDefaultRates } = require('./helpers/fixtures');

const app = createApp();
let att;
let admin;

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  await createUser('att1', 'ATTENDANT');
  await createUser('admin1', 'ADMIN');
  att = await loginAs(app, 'att1');
  admin = await loginAs(app, 'admin1');
  await addDefaultRates();
});

const get = (token, path) => request(app).get(`/api/v1${path}`).set('Authorization', `Bearer ${token}`);

describe('FR-10 slot availability display and counts (TC-SLOT-03)', () => {
  beforeEach(async () => {
    // 10 Car slots: 6 Available, 3 Occupied, 1 Unavailable; 5 Two-wheeler slots all Available.
    await addSlots('CAR', ['A-01', 'A-02', 'A-03', 'A-04', 'A-05', 'A-06']);
    await addSlots('CAR', ['A-07', 'A-08', 'A-09'], 'OCCUPIED');
    await addSlots('CAR', ['A-10'], 'UNAVAILABLE');
    await addSlots('TWO_WHEELER', ['B-01', 'B-02', 'B-03', 'B-04', 'B-05']);
  });

  it('lists every slot with Slot ID, type and status', async () => {
    const res = await get(att, '/slots');
    expect(res.status).toBe(200);
    expect(res.body.slots).toHaveLength(15);
    expect(res.body.slots[0]).toMatchObject({ slotId: 'A-01', slotType: 'CAR', status: 'AVAILABLE' });
    expect(res.body.slots.find((s) => s.slotId === 'A-10').status).toBe('UNAVAILABLE');
  });

  it('shows Available and Occupied counts per type', async () => {
    const res = await get(att, '/slots/summary');
    expect(res.status).toBe(200);
    const car = res.body.byType.find((t) => t.slotType === 'CAR');
    const two = res.body.byType.find((t) => t.slotType === 'TWO_WHEELER');
    expect(car).toMatchObject({ available: 6, occupied: 3, unavailable: 1, total: 10 });
    expect(two).toMatchObject({ available: 5, occupied: 0, total: 5 });
  });

  it('is shown to every authenticated user, and only to them', async () => {
    expect((await get(admin, '/slots')).status).toBe(200);
    expect((await request(app).get('/api/v1/slots')).status).toBe(401);
  });
});

describe('FR-20 search a vehicle (TC-SRCH-01)', () => {
  beforeEach(async () => {
    await addVehicle('KA01AB1234', 'CAR');
    await addVehicle('KA02CD5678', 'CAR');
  });

  it('finds registered vehicles (attendant and administrator)', async () => {
    const a = await get(att, '/vehicles/search?regNo=KA01AB1234');
    const b = await get(admin, '/vehicles/search?regNo=ka02cd5678');
    expect(a.status).toBe(200);
    expect(a.body.vehicle).toMatchObject({ regNo: 'KA01AB1234', vehicleType: 'CAR' });
    expect(b.body.vehicle.regNo).toBe('KA02CD5678');
  });

  it('an unregistered number returns "Vehicle not found" and no data', async () => {
    const res = await get(att, '/vehicles/search?regNo=KA09ZZ0000');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Vehicle not found');
    expect(res.body.vehicle).toBeUndefined();
  });
});

describe('FR-21 current status (TC-SRCH-02)', () => {
  it('Parked with Slot ID, entry time and elapsed duration; others Not Parked', async () => {
    await addSlots('CAR', ['A-01']);
    await addVehicle('KA01AB1234', 'CAR');
    await addVehicle('KA02CD5678', 'CAR');
    await request(app).post('/api/v1/parking/entry').set('Authorization', `Bearer ${att}`).send({ regNo: 'KA01AB1234' });

    const parked = await get(att, '/vehicles/search?regNo=KA01AB1234');
    expect(parked.body.current).toMatchObject({ status: 'PARKED', slotId: 'A-01' });
    expect(parked.body.current.entryTime).toBeTruthy();
    expect(typeof parked.body.current.elapsedMin).toBe('number');

    const notParked = await get(att, '/vehicles/search?regNo=KA02CD5678');
    expect(notParked.body.current).toEqual({ status: 'NOT_PARKED' });
  });
});
