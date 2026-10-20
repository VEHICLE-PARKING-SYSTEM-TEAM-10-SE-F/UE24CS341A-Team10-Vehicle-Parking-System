// FR-04: Administrator manages user accounts and roles (TC-AUTH-04).
const request = require('supertest');
const { createApp } = require('../src/app');
const User = require('../src/models/User');
const { startDb, clearDb, stopDb } = require('./helpers/db');
const { createUser, loginAs } = require('./helpers/auth');

const app = createApp();
let admin;

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  await createUser('admin1', 'ADMIN');
  admin = await loginAs(app, 'admin1');
});

const as = (token) => ({
  get: (p) => request(app).get(`/api/v1${p}`).set('Authorization', `Bearer ${token}`),
  post: (p, b) => request(app).post(`/api/v1${p}`).set('Authorization', `Bearer ${token}`).send(b),
  put: (p, b) => request(app).put(`/api/v1${p}`).set('Authorization', `Bearer ${token}`).send(b),
  patch: (p, b) => request(app).patch(`/api/v1${p}`).set('Authorization', `Bearer ${token}`).send(b),
});

describe('TC-AUTH-04 administrator manages user accounts', () => {
  it('creates an attendant, changes its role, deactivates it; the deactivated account cannot log in', async () => {
    const created = await as(admin).post('/users', { username: 'att2', name: 'Attendant Two', password: 'Pass@1234', role: 'ATTENDANT' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ username: 'att2', role: 'ATTENDANT', active: true });
    expect(created.body.passwordHash).toBeUndefined();

    const login1 = await request(app).post('/api/v1/auth/login').send({ username: 'att2', password: 'Pass@1234' });
    expect(login1.status).toBe(200);

    const promoted = await as(admin).put(`/users/${created.body.id}`, { role: 'ADMIN' });
    expect(promoted.status).toBe(200);
    expect(promoted.body.role).toBe('ADMIN');

    const off = await as(admin).patch(`/users/${created.body.id}/status`, { active: false });
    expect(off.status).toBe(200);
    expect(off.body.active).toBe(false);

    const login2 = await request(app).post('/api/v1/auth/login').send({ username: 'att2', password: 'Pass@1234' });
    expect(login2.status).toBe(401);
  });

  it('deactivating a user ends their open session immediately', async () => {
    const u = await createUser('att3', 'ATTENDANT');
    const token = await loginAs(app, 'att3');
    await as(admin).patch(`/users/${u._id}/status`, { active: false });
    const res = await as(token).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('lists users without password hashes', async () => {
    await createUser('att1', 'ATTENDANT');
    const res = await as(admin).get('/users');
    expect(res.status).toBe(200);
    expect(res.body.users.map((u) => u.username)).toEqual(['admin1', 'att1']);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('rejects a duplicate username and names the field', async () => {
    await as(admin).post('/users', { username: 'att2', name: 'A', password: 'Pass@1234', role: 'ATTENDANT' });
    const res = await as(admin).post('/users', { username: 'att2', name: 'B', password: 'Pass@1234', role: 'ATTENDANT' });
    expect(res.status).toBe(409);
    expect(res.body.error.field).toBe('username');
  });

  it.each([
    ['short password', { username: 'att9', name: 'X', password: 'short', role: 'ATTENDANT' }, 'password'],
    ['unknown role', { username: 'att9', name: 'X', password: 'Pass@1234', role: 'OWNER' }, 'role'],
    ['bad username', { username: 'a b', name: 'X', password: 'Pass@1234', role: 'ATTENDANT' }, 'username'],
  ])('rejects %s with 400', async (_l, body, field) => {
    const res = await as(admin).post('/users', body);
    expect(res.status).toBe(400);
    expect(res.body.error.field).toBe(field);
  });

  it('an administrator cannot deactivate themself or change their own role', async () => {
    const me = await User.findOne({ username: 'admin1' });
    expect((await as(admin).patch(`/users/${me._id}/status`, { active: false })).status).toBe(409);
    expect((await as(admin).put(`/users/${me._id}`, { role: 'ATTENDANT' })).status).toBe(409);
  });

  it('is administrator-only (FR-05)', async () => {
    await createUser('att1', 'ATTENDANT');
    const att = await loginAs(app, 'att1');
    const res = await as(att).post('/users', { username: 'x123', name: 'X', password: 'Pass@1234', role: 'ADMIN' });
    expect(res.status).toBe(403);
    expect(await User.countDocuments({ username: 'x123' })).toBe(0);
  });
});
