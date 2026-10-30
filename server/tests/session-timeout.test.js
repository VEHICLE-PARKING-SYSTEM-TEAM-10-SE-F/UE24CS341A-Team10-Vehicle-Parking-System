// SEC-06: the session ends after 15 minutes of inactivity (TC-SEC-06).
const request = require('supertest');
const { createApp } = require('../src/app');
const Session = require('../src/models/Session');
const { IDLE_LIMIT_MS } = require('../src/middleware/authenticate');
const { startDb, clearDb, stopDb } = require('./helpers/db');
const { createUser, loginAs } = require('./helpers/auth');

const app = createApp();

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  await createUser('att1', 'ATTENDANT');
});

const idleFor = (ms) => Session.updateMany({}, { $set: { lastActivityAt: new Date(Date.now() - ms) } });
const me = (token) => request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);

it('the idle limit is 15 minutes', () => {
  expect(IDLE_LIMIT_MS).toBe(15 * 60 * 1000);
});

it('after 15 min 30 s idle the next request gets 401 and the session stays ended', async () => {
  const token = await loginAs(app, 'att1');
  await idleFor(15.5 * 60 * 1000);
  const res = await me(token);
  expect(res.status).toBe(401);
  expect(res.body.error.code).toBe('SESSION_EXPIRED');
  expect((await me(token)).status).toBe(401);
});

it('activity within 15 minutes keeps the session alive', async () => {
  const token = await loginAs(app, 'att1');
  await idleFor(14 * 60 * 1000);
  expect((await me(token)).status).toBe(200);
  await idleFor(14 * 60 * 1000); // the last request reset the clock
  expect((await me(token)).status).toBe(200);
});
