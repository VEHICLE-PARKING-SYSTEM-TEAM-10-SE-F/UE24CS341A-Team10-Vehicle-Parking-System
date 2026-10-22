const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { jwtSecret } = require('../config/env');

const unauthenticated = () => new AppError(401, 'UNAUTHENTICATED', 'Please log in to continue');

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

    const user = await User.findOne({ _id: payload.sub, active: true });
    if (!user) throw unauthenticated();

    session.lastActivityAt = new Date();
    await session.save();

    req.user = { id: String(user._id), username: user.username, name: user.name, role: user.role };
    req.session = { jti: payload.jti };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
