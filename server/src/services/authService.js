const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const AppError = require('../utils/AppError');
const { verifyPassword, hashPasswordSync } = require('../utils/password');
const { jwtSecret } = require('../config/env');

const INVALID = 'Invalid username or password';
// Compared against when the username doesn't exist, so both failure cases take the same time.
let dummyHash;
const getDummyHash = () => {
  if (!dummyHash) dummyHash = hashPasswordSync(crypto.randomUUID());
  return dummyHash;
};

async function login(username, password) {
  const user = await User.findOne({ username, active: true });
  const ok = await verifyPassword(password, user ? user.passwordHash : getDummyHash());
  if (!user || !ok) {
    // FR-02: one message for every failure, without saying which field was wrong.
    throw new AppError(401, 'INVALID_CREDENTIALS', INVALID);
  }
  const jti = crypto.randomUUID();
  await Session.create({ jti, userId: user._id, lastActivityAt: new Date() });
  const token = jwt.sign({ sub: String(user._id), role: user.role, jti }, jwtSecret(), {
    algorithm: 'HS256',
    expiresIn: '12h',
  });
  return { token, user: { id: String(user._id), username: user.username, name: user.name, role: user.role } };
}

async function logout(jti) {
  await Session.updateOne({ jti }, { $set: { revoked: true } });
}

module.exports = { login, logout, INVALID };
