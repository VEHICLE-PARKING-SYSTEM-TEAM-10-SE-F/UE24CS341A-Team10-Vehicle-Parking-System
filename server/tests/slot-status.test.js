// FR-09: set a slot Unavailable and back to Available; not while Occupied (TC-SLOT-02).
const request = require('supertest');
const { createApp } = require('../src/app');
const Slot = require('../src/models/Slot');
const { startDb, clearDb, stopDb } = require('./helpers/db');
const { createUser, loginAs } = require('./helpers/auth');
const { addSlots, addVehicle } = require('./helpers/fixtures');

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
  await addSlots('CAR', ['A-02']);
  await addSlots('CAR', ['A-03'], 'OCCUPIED');
  await addVehicle('KA01AB1234', 'CAR');
});

const setStatus = (token, slotId, status) => request(app).patch(`/api/v1/slots/${slotId}/status`)
  .set('Authorization', `Bearer ${token}`).send({ status });
const enter = () => request(app).post('/api/v1/parking/entry').set('Authorization', `Bearer ${att}`).send({ regNo: 'KA01AB1234' });

describe('TC-SLOT-02 set a slot Unavailable and back to Available', () => {
  it('an Unavailable slot is never allocated; set back to Available it is allocated again', async () => {
    const off = await setStatus(admin, 'A-02', 'UNAVAILABLE');
    expect(off.status).toBe(200);
    expect(off.body.status).toBe('UNAVAILABLE');

    const refused = await enter();
    expect(refused.status).toBe(409);
    expect(refused.body.error.message).toBe('No parking slot available for this vehicle type');

    const on = await setStatus(admin, 'a-02', 'AVAILABLE');
    expect(on.body.status).toBe('AVAILABLE');
    const ok = await enter();
    expect(ok.status).toBe(201);
    expect(ok.body.slotId).toBe('A-02');
  });

  it('setting an Occupied slot to Unavailable is rejected and nothing changes', async () => {
    const res = await setStatus(admin, 'A-03', 'UNAVAILABLE');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SLOT_OCCUPIED');
    expect((await Slot.findOne({ slotId: 'A-03' })).status).toBe('OCCUPIED');
  });

  it('cannot set a slot to Occupied by hand, and unknown slots get 404', async () => {
    expect((await setStatus(admin, 'A-02', 'OCCUPIED')).status).toBe(400);
    expect((await setStatus(admin, 'Z-99', 'UNAVAILABLE')).status).toBe(404);
  });

  it('is administrator-only (BR-05)', async () => {
    const res = await setStatus(att, 'A-02', 'UNAVAILABLE');
    expect(res.status).toBe(403);
    expect((await Slot.findOne({ slotId: 'A-02' })).status).toBe('AVAILABLE');
  });
});
