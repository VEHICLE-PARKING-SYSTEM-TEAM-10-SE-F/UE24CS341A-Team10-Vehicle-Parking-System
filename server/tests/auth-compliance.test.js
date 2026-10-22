// Comprehensive Test Suite for Ramitha R's Tasks (Sprint 1)
// FR-01, FR-02, FR-03, FR-05, SEC-01, SEC-02, SEC-03, SEC-05, SEC-07
// Test Cases: TC-AUTH-01, TC-AUTH-02, TC-AUTH-03, TC-AUTH-05, TC-SEC-01, TC-SEC-02, TC-SEC-03, TC-SEC-05, TC-SEC-07

const request = require('supertest');
const { createApp } = require('../src/app');
const User = require('../src/models/User');
const { startDb, clearDb, stopDb } = require('./helpers/db');
const { PASSWORD, createUser, loginAs } = require('./helpers/auth');

const app = createApp();

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  await createUser('att1', 'ATTENDANT');
  await createUser('admin1', 'ADMIN');
});

describe('Ramitha R - Authentication & Security Requirements (Sprint 1)', () => {
  // FR-01: TC-AUTH-01
  it('FR-01 (TC-AUTH-01): authenticates user and issues session token identifying role', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ username: 'att1', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ username: 'att1', role: 'ATTENDANT' });
  });

  // FR-02: TC-AUTH-02
  it('FR-02 (TC-AUTH-02): rejects invalid credentials with generic message', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ username: 'att1', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid username or password');
    expect(res.body.token).toBeUndefined();
  });

  // FR-03: TC-AUTH-03
  it('FR-03 (TC-AUTH-03): logout invalidates session token', async () => {
    const token = await loginAs(app, 'att1');
    const logoutRes = await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(logoutRes.status).toBe(200);

    const recheck = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(recheck.status).toBe(401);
  });

  // FR-05 & SEC-02: TC-AUTH-05 / TC-SEC-02
  it('FR-05, SEC-02 (TC-AUTH-05, TC-SEC-02): denies out-of-role requests with HTTP 403', async () => {
    const attToken = await loginAs(app, 'att1');
    const res = await request(app).post('/api/v1/slots').set('Authorization', `Bearer ${attToken}`).send({ slotId: 'B-01', slotType: 'CAR' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // SEC-01: TC-SEC-01
  it('SEC-01 (TC-SEC-01): enforces authentication on protected routes', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  // SEC-03: TC-SEC-03
  it('SEC-03 (TC-SEC-03): stores passwords only as bcrypt hashes with cost factor >= 10', async () => {
    const user = await User.findOne({ username: 'att1' });
    expect(user.passwordHash).toMatch(/^\$2[aby]?\$1[0-9]\$/);
    expect(user.passwordHash).not.toContain(PASSWORD);
  });

  // SEC-05: TC-SEC-05
  it('SEC-05 (TC-SEC-05): server-side validation rejects NoSQL operators and script injection', async () => {
    const nosqlRes = await request(app).post('/api/v1/auth/login').send({ username: { $gt: '' }, password: PASSWORD });
    expect(nosqlRes.status).toBe(400);

    const scriptRes = await request(app).post('/api/v1/auth/login').send({ username: '<script>alert(1)</script>', password: PASSWORD });
    expect(scriptRes.status).toBe(400);
  });

  // SEC-07: TC-SEC-07
  it('SEC-07 (TC-SEC-07): secrets are required from environment configuration', () => {
    const env = require('../src/config/env');
    expect(typeof env.jwtSecret()).toBe('string');
    expect(env.jwtSecret().length).toBeGreaterThanOrEqual(32);
  });
});
