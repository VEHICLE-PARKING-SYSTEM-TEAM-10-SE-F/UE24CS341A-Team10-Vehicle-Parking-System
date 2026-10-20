const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { jwtSecret } = require('../config/env');

const unauthenticated = () => new AppError(401, 'UNAUTHENTICATED', 'Please log in to continue');

// SEC-06: a session ends after 15 minutes without any request.
const IDLE_LIMIT_MS = 15 * 60 * 1000;

// SEC-01: every endpoint except login needs a valid token *and* a live server-side session.
// FR-03: a revoked (logged-out) session is rejected even if the JWT itself is still valid.
async function authenticate(req, res, next) {
  try {
    const header = req.get('Authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw unauthenticated();

    let payload;
    try {
      payload = jwt.verify(token, jwtSecret(), { algorithms: ['HS256'] });
    } catch {
      throw unauthenticated();
    }

    const session = await Session.findOne({ jti: payload.jti, revoked: false });
    if (!session) throw unauthenticated();

    const now = new Date();
    if (now - session.lastActivityAt > IDLE_LIMIT_MS) {
      session.revoked = true;
      await session.save();
      throw new AppError(401, 'SESSION_EXPIRED', 'Your session ended after 15 minutes without activity. Please log in again.');
    }

    const user = await User.findOne({ _id: payload.sub, active: true });
    if (!user) throw unauthenticated();

    session.lastActivityAt = now;
    await session.save();

    req.user = { id: String(user._id), username: user.username, name: user.name, role: user.role };
    req.session = { jti: payload.jti };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
module.exports.IDLE_LIMIT_MS = IDLE_LIMIT_MS;
