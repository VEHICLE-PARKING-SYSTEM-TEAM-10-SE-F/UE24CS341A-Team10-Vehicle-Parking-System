// NFR-05: acknowledged entries and exits survive a restart of the backend and MongoDB (TC-REL-01).
const os = require('os');
const path = require('path');
const fs = require('fs');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { createApp } = require('../src/app');
const { connect, disconnect } = require('../src/db');
const ParkingRecord = require('../src/models/ParkingRecord');
const { createUser, loginAs } = require('./helpers/auth');
const { addSlots, addVehicle, addDefaultRates } = require('./helpers/fixtures');

const dbPath = fs.mkdtempSync(path.join(os.tmpdir(), 'vps-rel-'));
let replSet;

async function startMongo() {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
    instanceOpts: [{ dbPath, port: replSet ? replSet.servers[0].instanceInfo.port : undefined }],
  });
  await connect(replSet.getUri('vps-rel'));
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

afterAll(async () => {
  await disconnect();
  if (replSet) await replSet.stop({ doCleanup: true, force: true });
  fs.rmSync(dbPath, { recursive: true, force: true });
});

it('5 entries and 3 exits are all still there, unchanged, after a restart', async () => {
  await startMongo();
  let app = createApp();
  await createUser('att1', 'ATTENDANT');
  await addDefaultRates();
  await addSlots('CAR', ['A-01', 'A-02', 'A-03', 'A-04', 'A-05']);
  const regNos = ['KA01AA0001', 'KA01AA0002', 'KA01AA0003', 'KA01AA0004', 'KA01AA0005'];
  for (const r of regNos) await addVehicle(r, 'CAR');
  const token = await loginAs(app, 'att1');
  const auth = (req) => req.set('Authorization', `Bearer ${token}`);

  const tickets = [];
  for (const r of regNos) {
    const res = await auth(request(app).post('/api/v1/parking/entry')).send({ regNo: r });
    expect(res.status).toBe(201);
    tickets.push(res.body.ticketNo);
  }
  for (const r of regNos.slice(0, 3)) {
    const ex = await auth(request(app).post('/api/v1/parking/exit')).send({ regNo: r });
    const ok = await auth(request(app).post(`/api/v1/parking/${ex.body.ticketNo}/confirm-exit`));
    expect(ok.status).toBe(200);
  }
  const before = await ParkingRecord.find().sort({ ticketNo: 1 }).lean();

  // Restart: stop the backend's connection and MongoDB (keeping the data files), then start both again.
  await disconnect();
  await replSet.stop({ doCleanup: false });
  await startMongo();
  app = createApp();

  const after = await ParkingRecord.find().sort({ ticketNo: 1 }).lean();
  expect(after).toHaveLength(5);
  expect(after.map((r) => [r.ticketNo, r.status, r.slotId, r.feePaise])).toEqual(
    before.map((r) => [r.ticketNo, r.status, r.slotId, r.feePaise]),
  );
  expect(after.filter((r) => r.status === 'COMPLETED')).toHaveLength(3);
}, 180000);
