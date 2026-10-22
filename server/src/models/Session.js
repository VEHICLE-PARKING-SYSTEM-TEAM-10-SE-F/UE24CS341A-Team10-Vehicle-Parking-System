const mongoose = require('mongoose');

// Server-side session behind each JWT (SAD ADR-03): lets logout revoke a token (FR-03).
const sessionSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastActivityAt: { type: Date, required: true, default: Date.now },
  revoked: { type: Boolean, default: false },
  // Old sessions are removed automatically after a day.
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 },
});

module.exports = mongoose.model('Session', sessionSchema);
