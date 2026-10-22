const request = require('supertest');
const { createApp } = require('../src/app');
const Slot = require('../src/models/Slot');
const { startDb, clearDb, stopDb } = require('./helpers/db');
const { createUser, loginAs } = require('./helpers/auth');

const app = createApp();
let admin;
let attendant;

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  await createUser('admin1', 'ADMIN');
  await createUser('att1', 'ATTENDANT');
  admin = await loginAs(app, 'admin1');
  attendant = await loginAs(app, 'att1');
});

const addSlot = (token, body) => request(app).post('/api/v1/slots').set('Authorization', `Bearer ${token}`).send(body);

describe('FR-08 administrator adds a parking slot (TC-SLOT-01)', () => {
  it('creates slot A-01 with status Available', async () => {
    const res = await addSlot(admin, { slotId: 'A-01', slotType: 'CAR' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ slotId: 'A-01', slotType: 'CAR', status: 'AVAILABLE' });
  });

  it('rejects the same Slot ID again', async () => {
    await addSlot(admin, { slotId: 'A-01', slotType: 'CAR' });
    const res = await addSlot(admin, { slotId: 'a-01', slotType: 'CAR' });
    expect(res.status).toBe(409);
    expect(res.body.error.field).toBe('slotId');
    expect(await Slot.countDocuments()).toBe(1);
  });

  it('rejects an invalid slot type', async () => {
    const res = await addSlot(admin, { slotId: 'A-02', slotType: 'BUS' });
    expect(res.status).toBe(400);
    expect(res.body.error.field).toBe('slotType');
  });

  it('is an administrator-only function (FR-05, BR-05)', async () => {
    const res = await addSlot(attendant, { slotId: 'A-03', slotType: 'CAR' });
    expect(res.status).toBe(403);
    expect(await Slot.countDocuments()).toBe(0);
  });
});
