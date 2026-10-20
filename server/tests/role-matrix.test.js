// SEC-01, SEC-02, FR-05: every endpoint against the SAD §4.3 role matrix (TC-SEC-01, TC-SEC-02).
// New endpoints are added to this table as they are built.
const request = require('supertest');
const { createApp } = require('../src/app');
const { startDb, clearDb, stopDb } = require('./helpers/db');
const { createUser, loginAs } = require('./helpers/auth');

const app = createApp();
const tokens = {};

// [method, path, allowed roles]; anything else must get 403 (or 401 without login).
const MATRIX = [
  ['post', '/auth/logout', ['ATTENDANT', 'ADMIN']],
  ['get', '/auth/me', ['ATTENDANT', 'ADMIN']],
  ['post', '/vehicles', ['ATTENDANT', 'ADMIN']],
  ['get', '/vehicles/search?regNo=KA01AB1234', ['ATTENDANT', 'ADMIN']],
  ['get', '/slots', ['ATTENDANT', 'ADMIN']],
  ['get', '/slots/summary', ['ATTENDANT', 'ADMIN']],
  ['post', '/slots', ['ADMIN']],
  ['post', '/parking/entry', ['ATTENDANT', 'ADMIN']],
  ['post', '/parking/exit', ['ATTENDANT', 'ADMIN']],
  ['post', '/parking/T-20261019-0001/confirm-exit', ['ATTENDANT', 'ADMIN']],
  ['post', '/parking/T-20261019-0001/cancel-exit', ['ATTENDANT', 'ADMIN']],
  ['get', '/users', ['ADMIN']],
  ['post', '/users', ['ADMIN']],
  ['put', '/users/000000000000000000000000', ['ADMIN']],
  ['patch', '/users/000000000000000000000000/status', ['ADMIN']],
];

beforeAll(async () => {
  await startDb();
  await clearDb();
  await createUser('att1', 'ATTENDANT');
  await createUser('admin1', 'ADMIN');
  tokens.ATTENDANT = await loginAs(app, 'att1');
  tokens.ADMIN = await loginAs(app, 'admin1');
});
afterAll(stopDb);

describe.each(MATRIX)('%s %s', (method, path, allowed) => {
  it('requires authentication (401 without a token)', async () => {
    const res = await request(app)[method](`/api/v1${path}`).send({});
    expect(res.status).toBe(401);
  });

  it.each(['ATTENDANT', 'ADMIN'])('role %s', async (role) => {
    // Logging out ends the session, so that row uses its own fresh login.
    const token = path === '/auth/logout' ? await loginAs(app, role === 'ADMIN' ? 'admin1' : 'att1') : tokens[role];
    const res = await request(app)[method](`/api/v1${path}`).set('Authorization', `Bearer ${token}`).send({});
    if (allowed.includes(role)) {
      expect(res.status).not.toBe(403);
      expect(res.status).not.toBe(401);
    } else {
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: { code: 'FORBIDDEN', message: 'You do not have permission to do this.', field: null } });
    }
  });
});

it('only login is reachable without logging in', async () => {
  const res = await request(app).post('/api/v1/auth/login').send({ username: 'att1', password: 'wrong' });
  expect(res.status).toBe(401);
  expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
});
