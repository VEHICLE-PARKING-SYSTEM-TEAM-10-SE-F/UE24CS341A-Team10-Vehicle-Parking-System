const request = require('supertest');
const User = require('../../src/models/User');
const { hashPassword } = require('../../src/utils/password');

const PASSWORD = 'Pass@1234';

async function createUser(username, role, extra = {}) {
  return User.create({ username, name: username, role, passwordHash: await hashPassword(PASSWORD), ...extra });
}

async function loginAs(app, username) {
  const res = await request(app).post('/api/v1/auth/login').send({ username, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login failed for ${username}: ${res.status}`);
  return res.body.token;
}

module.exports = { PASSWORD, createUser, loginAs };
