// Performance tests NFR-01 – NFR-03 (STP TC-PERF-01, TC-PERF-02) against a RUNNING server.
//
//   TC-PERF-01  vehicle search: 50 concurrent virtual users for --duration seconds
//               (STP: 10 minutes, ramp-up 30 s), random registration numbers; p95 <= 3 s, errors < 1 %.
//   TC-PERF-02  20 concurrent users, 200 operations in total, each = entry then exit (+ confirm);
//               p95 of entry and of exit (with fee calculation) <= 3 s.
//
// Test data (STP §6): 500 vehicles and 100 slots, created with the prefix PERF and removed afterwards.
// Usage: npm run perf -- [--duration 600] [--base http://localhost:5000] [--out ../docs/test-results/performance.md]
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]]);
  return acc;
}, []));
const BASE = `${args.base || `http://localhost:${process.env.PORT || 5000}`}/api/v1`;
const DURATION_S = Number(args.duration || 600);
const RAMP_S = Math.min(30, DURATION_S / 4);
const OUT = args.out || path.join(__dirname, '..', '..', 'docs', 'test-results', 'performance.md');

const VEHICLES = 500;
const SLOTS = 100;
const regNo = (i) => `PERF${String(i).padStart(4, '0')}`;

async function call(method, p, token, body) {
  const start = performance.now();
  try {
    const res = await fetch(BASE + p, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { ms: performance.now() - start, status: res.status, data };
  } catch {
    return { ms: performance.now() - start, status: 0, data: null };
  }
}

const p95 = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, Math.ceil(s.length * 0.95) - 1)] : NaN;
};
const avg = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`login failed for ${username} (${res.status}) - run npm run seed first`);
  return (await res.json()).token;
}

async function seedPerfData() {
  const db = mongoose.connection.db;
  await cleanPerfData();
  const now = new Date();
  await db.collection('vehicles').insertMany(Array.from({ length: VEHICLES }, (_, i) => ({
    regNo: regNo(i), vehicleType: 'CAR', active: true, createdAt: now, updatedAt: now,
  })));
  await db.collection('slots').insertMany(Array.from({ length: SLOTS }, (_, i) => ({
    slotId: `P-${String(i).padStart(3, '0')}`, slotType: 'CAR', status: 'AVAILABLE', currentVehicleId: null, lastUpdated: now,
  })));
}

async function cleanPerfData() {
  const db = mongoose.connection.db;
  const ids = (await db.collection('vehicles').find({ regNo: /^PERF/ }, { projection: { _id: 1 } }).toArray()).map((v) => v._id);
  await db.collection('parkingrecords').deleteMany({ vehicleId: { $in: ids } });
  await db.collection('vehicles').deleteMany({ regNo: /^PERF/ });
  await db.collection('slots').deleteMany({ slotId: /^P-/ });
}

// TC-PERF-01
async function searchLoad(token) {
  const users = 50;
  const lat = [];
  let errors = 0;
  const end = Date.now() + DURATION_S * 1000;
  await Promise.all(Array.from({ length: users }, async (_, u) => {
    await new Promise((r) => setTimeout(r, (RAMP_S * 1000 * u) / users)); // ramp-up
    while (Date.now() < end) {
      const r = await call('GET', `/vehicles/search?regNo=${regNo(Math.floor(Math.random() * VEHICLES))}`, token);
      lat.push(r.ms);
      if (r.status !== 200) errors += 1;
    }
  }));
  return { users, requests: lat.length, p95: p95(lat), avg: avg(lat), max: Math.max(...lat), errorRate: errors / lat.length };
}

// TC-PERF-02
async function entryExitLoad(token) {
  const users = 20;
  const total = 200;
  const entryLat = [];
  const exitLat = [];
  let errors = 0;
  let next = 0;
  await Promise.all(Array.from({ length: users }, async () => {
    while (next < total) {
      const i = next;
      next += 1;
      const reg = regNo(i);
      const e = await call('POST', '/parking/entry', token, { regNo: reg });
      entryLat.push(e.ms);
      if (e.status !== 201) { errors += 1; continue; }
      const x = await call('POST', '/parking/exit', token, { regNo: reg });
      exitLat.push(x.ms);
      if (x.status !== 200) { errors += 1; continue; }
      const c = await call('POST', `/parking/${x.data.ticketNo}/confirm-exit`, token);
      if (c.status !== 200) errors += 1;
    }
  }));
  return { users, operations: total, entryP95: p95(entryLat), entryAvg: avg(entryLat), exitP95: p95(exitLat), exitAvg: avg(exitLat), errors };
}

const fmt = (ms) => `${(ms / 1000).toFixed(3)} s`;
const verdict = (ok) => (ok ? '**PASS**' : '**FAIL**');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const token = await login('att1', process.env.SEED_ATTENDANT_PASSWORD);
  console.log(`Seeding ${VEHICLES} vehicles and ${SLOTS} slots...`);
  await seedPerfData();
  try {
    console.log(`TC-PERF-01: 50 users searching for ${DURATION_S} s...`);
    const s = DURATION_S > 0 ? await searchLoad(token) : { users: 0, requests: 0, p95: 0, avg: 0, max: 0, errorRate: 0 };
    console.log(`  ${s.requests} requests, p95 ${fmt(s.p95)}, errors ${(s.errorRate * 100).toFixed(2)} %`);
    console.log('TC-PERF-02: 20 users, 200 entry + exit operations...');
    const ee = await entryExitLoad(token);
    console.log(`  entry p95 ${fmt(ee.entryP95)}, exit p95 ${fmt(ee.exitP95)}, errors ${ee.errors}`);

    const pass1 = s.p95 <= 3000 && s.errorRate < 0.01;
    const pass2 = ee.entryP95 <= 3000;
    const pass3 = ee.exitP95 <= 3000;
    const report = `# Performance test results (NFR-01 – NFR-03)

Run on ${new Date().toISOString()} with \`npm run perf -- --duration ${DURATION_S}\` against the running API
(Node ${process.version}, ${process.platform}; test data: ${VEHICLES} vehicles, ${SLOTS} slots).

| Test case | Requirement | Load | Result | Target | Verdict |
|---|---|---|---|---|---|
| TC-PERF-01 | NFR-01 vehicle search | ${s.users} concurrent users, ${DURATION_S} s (ramp-up ${RAMP_S} s), ${s.requests} requests | p95 ${fmt(s.p95)} (avg ${fmt(s.avg)}, max ${fmt(s.max)}), errors ${(s.errorRate * 100).toFixed(2)} % | p95 ≤ 3 s, errors < 1 % | ${verdict(pass1)} |
| TC-PERF-02 | NFR-02 entry with slot allocation | ${ee.users} concurrent users, ${ee.operations} operations | p95 ${fmt(ee.entryP95)} (avg ${fmt(ee.entryAvg)}) | p95 ≤ 3 s | ${verdict(pass2)} |
| TC-PERF-02 | NFR-03 exit with fee calculation | ${ee.users} concurrent users, ${ee.operations} operations | p95 ${fmt(ee.exitP95)} (avg ${fmt(ee.exitAvg)}) | p95 ≤ 3 s | ${verdict(pass3)} |

Errors during TC-PERF-02: ${ee.errors}.
`;
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, report);
    console.log(`Report written to ${OUT}`);
    process.exitCode = pass1 && pass2 && pass3 ? 0 : 1;
  } finally {
    await cleanPerfData();
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('Performance test could not run:', err.message);
  process.exit(1);
});
