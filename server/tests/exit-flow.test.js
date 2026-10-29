// FR-15 – FR-18: exit, fee summary, confirm / cancel (TC-EXT-01, TC-FEE-02 part).
const request = require('supertest');
const { createApp } = require('../src/app');
const ParkingRecord = require('../src/models/ParkingRecord');
const Slot = require('../src/models/Slot');
const FeeRate = require('../src/models/FeeRate');
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
  await addDefaultRates();
  await addSlots('CAR', ['A-01']);
  await addVehicle('KA01AB1234', 'CAR');
});

const auth = (req) => req.set('Authorization', `Bearer ${token}`);

async function parkedMinutesAgo(minutes) {
  const res = await auth(request(app).post('/api/v1/parking/entry')).send({ regNo: 'KA01AB1234' });
  await ParkingRecord.updateOne({ ticketNo: res.body.ticketNo }, { $set: { entryTime: new Date(Date.now() - minutes * 60000) } });
  return res.body.ticketNo;
}

describe('TC-EXT-01 record a vehicle exit (happy path)', () => {
  it('shows entry time, exit time, duration and fee before confirming (FR-17)', async () => {
    const ticketNo = await parkedMinutesAgo(90);
    const res = await auth(request(app).post('/api/v1/parking/exit')).send({ regNo: 'KA01AB1234' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ticketNo, slotId: 'A-01', status: 'ACTIVE', durationMin: 90, billableHours: 2, hourlyRate: '30.00', fee: '60.00',
    });
    expect(res.body.entryTime).toBeTruthy();
    expect(res.body.exitTime).toBeTruthy();
    // Not final yet: the slot is still Occupied until the attendant confirms.
    expect((await Slot.findOne({ slotId: 'A-01' })).status).toBe('OCCUPIED');
  });

  it('on Confirm Exit the record is Completed with the fee and the slot becomes Available (FR-18)', async () => {
    const ticketNo = await parkedMinutesAgo(90);
    await auth(request(app).post('/api/v1/parking/exit')).send({ regNo: 'KA01AB1234' });
    const res = await auth(request(app).post(`/api/v1/parking/${ticketNo}/confirm-exit`));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'COMPLETED', fee: '60.00' });
    const record = await ParkingRecord.findOne({ ticketNo });
    expect(record.status).toBe('COMPLETED');
    expect(record.feePaise).toBe(6000);
    expect((await Slot.findOne({ slotId: 'A-01' })).status).toBe('AVAILABLE');
  });

  it('a completed ticket cannot be confirmed again', async () => {
    const ticketNo = await parkedMinutesAgo(30);
    await auth(request(app).post('/api/v1/parking/exit')).send({ regNo: 'KA01AB1234' });
    await auth(request(app).post(`/api/v1/parking/${ticketNo}/confirm-exit`));
    const res = await auth(request(app).post(`/api/v1/parking/${ticketNo}/confirm-exit`));
    expect(res.status).toBe(409);
  });

  it('cannot confirm before the exit has been recorded', async () => {
    const ticketNo = await parkedMinutesAgo(30);
    const res = await auth(request(app).post(`/api/v1/parking/${ticketNo}/confirm-exit`));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EXIT_NOT_RECORDED');
  });

  it('Cancel leaves the record Active with no exit time', async () => {
    const ticketNo = await parkedMinutesAgo(30);
    await auth(request(app).post('/api/v1/parking/exit')).send({ regNo: 'KA01AB1234' });
    const res = await auth(request(app).post(`/api/v1/parking/${ticketNo}/cancel-exit`));
    expect(res.status).toBe(200);
    const record = await ParkingRecord.findOne({ ticketNo });
    expect(record.status).toBe('ACTIVE');
    expect(record.exitTime).toBeNull();
  });
});

describe('FR-19 rule: a changed rate applies to exits recorded after the change (TC-FEE-02)', () => {
  it('bills with the rate in force when the exit is recorded; a completed record keeps its fee', async () => {
    const ticketNo = await parkedMinutesAgo(120);
    await FeeRate.updateOne({ vehicleType: 'CAR' }, { $set: { hourlyRatePaise: 4000 } }); // Rs 30 -> Rs 40
    const res = await auth(request(app).post('/api/v1/parking/exit')).send({ regNo: 'KA01AB1234' });
    expect(res.body.fee).toBe('80.00'); // 120 min -> 2 billable hours x Rs 40
    await auth(request(app).post(`/api/v1/parking/${ticketNo}/confirm-exit`));

    await FeeRate.updateOne({ vehicleType: 'CAR' }, { $set: { hourlyRatePaise: 9900 } });
    expect((await ParkingRecord.findOne({ ticketNo })).feePaise).toBe(8000);
  });
});
