// FR-05 / SEC-02: the authorize() middleware. The full endpoint role matrix
// (TC-AUTH-05, TC-SEC-02) is tested in tests/role-matrix.test.js once the endpoints exist.
const express = require('express');
const request = require('supertest');
const authenticate = require('../src/middleware/authenticate');
const authorize = require('../src/middleware/authorize');
const { errorHandler } = require('../src/middleware/errorHandler');
const { createApp } = require('../src/app');
const { startDb, clearDb, stopDb } = require('./helpers/db');
const { createUser, loginAs } = require('./helpers/auth');

const app = createApp();
const probe = express();
probe.get('/admin-only', authenticate, authorize('ADMIN'), (req, res) => res.json({ secret: 'admin data' }));
probe.get('/staff', authenticate, authorize('ATTENDANT', 'ADMIN'), (req, res) => res.json({ ok: true }));
probe.use(errorHandler);

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  await createUser('att1', 'ATTENDANT');
  await createUser('admin1', 'ADMIN');
});

it('an attendant calling an admin-only function gets 403 with no protected data', async () => {
  const token = await loginAs(app, 'att1');
  const res = await request(probe).get('/admin-only').set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(403);
  expect(res.body.error.code).toBe('FORBIDDEN');
  expect(JSON.stringify(res.body)).not.toContain('admin data');
});

it('an administrator can call the admin-only function', async () => {
  const token = await loginAs(app, 'admin1');
  const res = await request(probe).get('/admin-only').set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
});

it('both roles can call a staff function', async () => {
  for (const user of ['att1', 'admin1']) {
    const token = await loginAs(app, user);
    const res = await request(probe).get('/staff').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  }
});

it('authorisation needs authentication first (401 before 403)', async () => {
  const res = await request(probe).get('/admin-only');
  expect(res.status).toBe(401);
});
