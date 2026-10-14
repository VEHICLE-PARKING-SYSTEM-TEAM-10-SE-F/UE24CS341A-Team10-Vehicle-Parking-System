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
});

describe('FR-01 login (TC-AUTH-01)', () => {
  it('issues a session token identifying the user and role', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ username: 'att1', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ username: 'att1', role: 'ATTENDANT' });

    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({ username: 'att1', role: 'ATTENDANT' });
  });
});

describe('FR-02 generic invalid-credentials message (TC-AUTH-02)', () => {
  it.each([
    ['wrong password', { username: 'att1', password: 'wrong' }],
    ['unknown user', { username: 'nouser', password: 'x' }],
  ])('%s gets exactly "Invalid username or password" and no token', async (_label, body) => {
    const res = await request(app).post('/api/v1/auth/login').send(body);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid username or password');
    expect(res.body.token).toBeUndefined();
  });

  it('a deactivated user cannot log in', async () => {
    await createUser('old1', 'ATTENDANT', { active: false });
    const res = await request(app).post('/api/v1/auth/login').send({ username: 'old1', password: PASSWORD });
    expect(res.status).toBe(401);
  });
});

describe('FR-03 logout (TC-AUTH-03)', () => {
  it('the old token is rejected with 401 after logout', async () => {
    const token = await loginAs(app, 'att1');
    const out = await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(out.status).toBe(200);
    const again = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(again.status).toBe(401);
  });
});

describe('SEC-01 authentication required (TC-SEC-01)', () => {
  it.each([
    ['no token', undefined],
    ['malformed token', 'Bearer abc'],
    ['wrong scheme', 'Basic abc'],
  ])('%s gets 401', async (_label, header) => {
    const req = request(app).get('/api/v1/auth/me');
    if (header) req.set('Authorization', header);
    const res = await req;
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('SEC-03 password storage (TC-SEC-03)', () => {
  it('stores a salted bcrypt hash with cost >= 10, never the password', async () => {
    await createUser('att2', 'ATTENDANT');
    const [a, b] = await Promise.all([User.findOne({ username: 'att1' }), User.findOne({ username: 'att2' })]);
    expect(a.passwordHash).toMatch(/^\$2[ab]\$(\d\d)\$/);
    expect(Number(a.passwordHash.slice(4, 6))).toBeGreaterThanOrEqual(10);
    expect(a.passwordHash).not.toContain(PASSWORD);
    expect(a.passwordHash).not.toBe(b.passwordHash); // unique salt
    expect(JSON.stringify(a.toJSON())).not.toContain('passwordHash');
  });

  it('never writes the password to the logs', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development'; // turn logging on for this test
    const spies = [jest.spyOn(console, 'log').mockImplementation(() => {}), jest.spyOn(console, 'error').mockImplementation(() => {})];
    try {
      await request(app).post('/api/v1/auth/login').send({ username: 'att1', password: PASSWORD });
      await request(app).post('/api/v1/auth/login').send({ username: 'att1', password: 'Secret@999' });
      const logged = spies.flatMap((s) => s.mock.calls.flat()).join('\n');
      expect(logged).toContain('/auth/login');
      expect(logged).not.toContain(PASSWORD);
      expect(logged).not.toContain('Secret@999');
    } finally {
      spies.forEach((s) => s.mockRestore());
      process.env.NODE_ENV = prev;
    }
  });
});

describe('SEC-05 input validation (TC-SEC-05)', () => {
  it.each([
    ['NoSQL operator as username', { username: { $ne: '' }, password: { $ne: '' } }],
    ['$gt operator', { username: { $gt: '' }, password: 'x' }],
    ['script in username', { username: '<script>alert(1)</script>', password: 'x' }],
    ['over-long username', { username: 'a'.repeat(10000), password: 'x' }],
    ['wrong type', { username: 12345, password: ['x'] }],
    ['unknown field', { username: 'att1', password: PASSWORD, role: 'ADMIN' }],
  ])('%s is rejected with 400', async (_label, body) => {
    const res = await request(app).post('/api/v1/auth/login').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.token).toBeUndefined();
  });
});
