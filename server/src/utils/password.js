const bcrypt = require('bcryptjs');

// Salted bcrypt hashes, cost factor 12 (SRS SEC-03 requires at least 10).
const COST = 12;

function hashPassword(plain) {
  return bcrypt.hash(plain, COST);
}

function hashPasswordSync(plain) {
  return bcrypt.hashSync(plain, COST);
}

function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, hashPasswordSync, verifyPassword, COST };
