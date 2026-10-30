const User = require('../models/User');
const Session = require('../models/Session');
const AppError = require('../utils/AppError');
const { hashPassword } = require('../utils/password');

function toDto(u) {
  return { id: String(u._id), username: u.username, name: u.name, role: u.role, active: u.active };
}

async function findUser(id) {
  const user = await User.findById(id);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found', 'userId');
  return user;
}

function list() {
  return User.find().sort({ username: 1 });
}

// FR-04: the Administrator creates Parking Attendant and Administrator accounts.
async function create({ username, name, password, role }) {
  if (await User.exists({ username })) {
    throw new AppError(409, 'DUPLICATE_USERNAME', `Username ${username} is already taken`, 'username');
  }
  return User.create({ username, name, role, passwordHash: await hashPassword(password) });
}

// FR-04: update name, role and (optionally) reset the password.
async function update(id, { name, role, password }, actingUserId) {
  const user = await findUser(id);
  if (String(user._id) === actingUserId && role && role !== user.role) {
    throw new AppError(409, 'CANNOT_CHANGE_OWN_ROLE', 'You cannot change your own role', 'role');
  }
  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (password) user.passwordHash = await hashPassword(password);
  await user.save();
  // A role or password change takes effect immediately: end the user's existing sessions.
  if (role !== undefined || password) await Session.updateMany({ userId: user._id }, { $set: { revoked: true } });
  return user;
}

// FR-04: deactivate / reactivate. Deactivation ends the user's sessions straight away.
async function setActive(id, active, actingUserId) {
  const user = await findUser(id);
  if (String(user._id) === actingUserId && !active) {
    throw new AppError(409, 'CANNOT_DEACTIVATE_SELF', 'You cannot deactivate your own account', 'active');
  }
  user.active = active;
  await user.save();
  if (!active) await Session.updateMany({ userId: user._id }, { $set: { revoked: true } });
  return user;
}

module.exports = { list, create, update, setActive, toDto };
