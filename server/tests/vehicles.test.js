const request = require('supertest');
const { createApp } = require('../src/app');
const Vehicle = require('../src/models/Vehicle');
const { startDb, clearDb, stopDb } = require('./helpers/db');
const { createUser, loginAs } = require('./helpers/auth');

const app = createApp();
let token;

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  await createUser('att1', 'ATTENDANT');
  token = await loginAs(app, 'att1');
});

const post = (body) => request(app).post('/api/v1/vehicles').set('Authorization', `Bearer ${token}`).send(body);

describe('FR-06 register a vehicle (TC-VEH-01)', () => {
  it('stores the registration number in upper case and confirms', async () => {
    const res = await post({ regNo: 'ka01ab1234', vehicleType: 'CAR' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ regNo: 'KA01AB1234', vehicleType: 'CAR' });
    expect(await Vehicle.countDocuments({ regNo: 'KA01AB1234' })).toBe(1);
  });

  it('accepts an optional owner contact number', async () => {
    const res = await post({ regNo: 'KA02CD5678', vehicleType: 'TWO_WHEELER', ownerContact: '9876543210' });
    expect(res.status).toBe(201);
    expect(res.body.ownerContact).toBe('9876543210');
  });
});

describe('FR-07 reject incomplete or duplicate vehicles (TC-VEH-02)', () => {
  it('rejects an empty vehicle type and names the field', async () => {
    const res = await post({ regNo: 'KA01AB1234' });
    expect(res.status).toBe(400);
    expect(res.body.error.field).toBe('vehicleType');
    expect(await Vehicle.countDocuments()).toBe(0);
  });

  it('rejects a duplicate registration number and names the field', async () => {
    await post({ regNo: 'KA01AB1234', vehicleType: 'CAR' });
    const res = await post({ regNo: 'ka01ab1234', vehicleType: 'CAR' });
    expect(res.status).toBe(409);
    expect(res.body.error.field).toBe('regNo');
    expect(res.body.error.message).toContain('KA01AB1234');
    expect(await Vehicle.countDocuments()).toBe(1);
  });
});

describe('FR-06/FR-07 registration number format boundaries (TC-VEH-03)', () => {
  it.each([
    ['ABC', 400],
    ['ABCD', 201],
    ['ABCDEFGHIJ12345', 201],
    ['ABCDEFGHIJ123456', 400],
    ['KA 01-AB 1234', 201],
    ['KA@01#AB', 400],
  ])('%s -> %i', async (regNo, status) => {
    const res = await post({ regNo, vehicleType: 'CAR' });
    expect(res.status).toBe(status);
    if (status === 400) expect(res.body.error.field).toBe('regNo');
  });
});

it('needs authentication', async () => {
  const res = await request(app).post('/api/v1/vehicles').send({ regNo: 'KA01AB1234', vehicleType: 'CAR' });
  expect(res.status).toBe(401);
});
