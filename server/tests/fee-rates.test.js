// FR-19: configure hourly rates (TC-FEE-01) and the rule that a change applies only to later exits (TC-FEE-02).
const request = require('supertest');
const { createApp } = require('../src/app');
const ParkingRecord = require('../src/models/ParkingRecord');
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

const put = (token, rates) => request(app).put('/api/v1/fee-rates').set('Authorization', `Bearer ${token}`).send({ rates });
const getRates = (token) => request(app).get('/api/v1/fee-rates').set('Authorization', `Bearer ${token}`);
const carRate = (res) => res.body.rates.find((r) => r.vehicleType === 'CAR').hourlyRate;

describe('TC-FEE-01 configure hourly rates', () => {
  it('Rs 40 is saved and shown', async () => {
    const res = await put(admin, [{ vehicleType: 'CAR', hourlyRate: 40 }]);
    expect(res.status).toBe(200);
    expect(carRate(res)).toBe('40.00');
    expect(carRate(await getRates(att))).toBe('40.00');
    expect((await getRates(att)).body.graceMinutes).toBe(15);
  });

  it.each([
    ['-5', -5],
    ['"abc"', 'abc'],
    ['three decimals', 40.123],
  ])('%s is rejected and the stored rate is unchanged', async (_label, value) => {
    await put(admin, [{ vehicleType: 'CAR', hourlyRate: 40 }]);
    const res = await put(admin, [{ vehicleType: 'CAR', hourlyRate: value }]);
    expect(res.status).toBe(400);
    expect(carRate(await getRates(admin))).toBe('40.00');
  });

  it('a rate of 0 is allowed', async () => {
    expect((await put(admin, [{ vehicleType: 'OTHER', hourlyRate: 0 }])).status).toBe(200);
  });

  it('only an administrator can change rates (BR-05)', async () => {
    const res = await put(att, [{ vehicleType: 'CAR', hourlyRate: 1 }]);
    expect(res.status).toBe(403);
    expect(carRate(await getRates(admin))).toBe('30.00');
  });
});

describe('TC-FEE-02 a rate change applies only to exits recorded after it', () => {
  const auth = (req) => req.set('Authorization', `Bearer ${att}`);

  async function parkTwoHoursAgo(regNo) {
    const e = await auth(request(app).post('/api/v1/parking/entry')).send({ regNo });
    await ParkingRecord.updateOne({ ticketNo: e.body.ticketNo }, { $set: { entryTime: new Date(Date.now() - 120 * 60000) } });
    return e.body.ticketNo;
  }

  async function exitAndConfirm(regNo) {
    const x = await auth(request(app).post('/api/v1/parking/exit')).send({ regNo });
    await auth(request(app).post(`/api/v1/parking/${x.body.ticketNo}/confirm-exit`));
    return x.body.fee;
  }

  it('C1 parked before the change and C2 parked after are both billed at Rs 40; completed fees never change', async () => {
    await addSlots('CAR', ['A-01', 'A-02']);
    await addVehicle('KA01CC0001', 'CAR');
    await addVehicle('KA01CC0002', 'CAR');

    const t1 = await parkTwoHoursAgo('KA01CC0001'); // C1 entered while the rate was Rs 30
    await put(admin, [{ vehicleType: 'CAR', hourlyRate: 40 }]);
    expect(await exitAndConfirm('KA01CC0001')).toBe('80.00');

    await parkTwoHoursAgo('KA01CC0002');
    expect(await exitAndConfirm('KA01CC0002')).toBe('80.00');

    await put(admin, [{ vehicleType: 'CAR', hourlyRate: 99 }]);
    expect((await ParkingRecord.findOne({ ticketNo: t1 })).feePaise).toBe(8000);
  });
});
