// Creates the starting accounts (STP Appendix A test users) if they don't exist yet.
// Passwords come from environment variables, never from the source code (SEC-07).
// Usage: npm run seed
const env = require('../src/config/env');
const { connect, disconnect } = require('../src/db');
const User = require('../src/models/User');
const FeeRate = require('../src/models/FeeRate');
const { hashPassword } = require('../src/utils/password');

async function ensureUser(username, name, role, password) {
  if (await User.exists({ username })) {
    console.log(`= ${username} already exists`);
    return;
  }
  await User.create({ username, name, role, passwordHash: await hashPassword(password) });
  console.log(`+ created ${role.toLowerCase()} ${username}`);
}

// Default hourly rates proposed in SRS 2.6 (to be confirmed); the Administrator can change them later (FR-19).
const DEFAULT_RATES_RUPEES = { TWO_WHEELER: 10, CAR: 30, OTHER: 50 };

async function ensureRates() {
  for (const [vehicleType, rupees] of Object.entries(DEFAULT_RATES_RUPEES)) {
    const res = await FeeRate.updateOne(
      { vehicleType },
      { $setOnInsert: { vehicleType, hourlyRatePaise: rupees * 100 } },
      { upsert: true },
    );
    console.log(res.upsertedCount ? `+ rate ${vehicleType} = Rs ${rupees}/hour` : `= rate ${vehicleType} already set`);
  }
}

async function main() {
  await connect(env.mongodbUri());
  const adminPassword = env.required('SEED_ADMIN_PASSWORD');
  const attendantPassword = env.required('SEED_ATTENDANT_PASSWORD');
  await ensureUser('admin1', 'Administrator', 'ADMIN', adminPassword);
  await ensureUser('att1', 'Attendant One', 'ATTENDANT', attendantPassword);
  await ensureUser('att2', 'Attendant Two', 'ATTENDANT', attendantPassword);
  await ensureRates();
  await disconnect();
}

main().catch(async (err) => {
  console.error(err.message);
  await disconnect();
  process.exit(1);
});
