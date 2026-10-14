// Creates the starting accounts (STP Appendix A test users) if they don't exist yet.
// Passwords come from environment variables, never from the source code (SEC-07).
// Usage: npm run seed
const env = require('../src/config/env');
const { connect, disconnect } = require('../src/db');
const User = require('../src/models/User');
const { hashPassword } = require('../src/utils/password');

async function ensureUser(username, name, role, password) {
  if (await User.exists({ username })) {
    console.log(`= ${username} already exists`);
    return;
  }
  await User.create({ username, name, role, passwordHash: await hashPassword(password) });
  console.log(`+ created ${role.toLowerCase()} ${username}`);
}

async function main() {
  await connect(env.mongodbUri());
  const adminPassword = env.required('SEED_ADMIN_PASSWORD');
  const attendantPassword = env.required('SEED_ATTENDANT_PASSWORD');
  await ensureUser('admin1', 'Administrator', 'ADMIN', adminPassword);
  await ensureUser('att1', 'Attendant One', 'ATTENDANT', attendantPassword);
  await ensureUser('att2', 'Attendant Two', 'ATTENDANT', attendantPassword);
  await disconnect();
}

main().catch(async (err) => {
  console.error(err.message);
  await disconnect();
  process.exit(1);
});
