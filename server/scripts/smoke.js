// End-to-end smoke test of the Sprint 1 flow against a RUNNING server
// (npm run dev:db, npm run seed, npm start). Uses the seeded accounts from .env.
// Usage: npm run smoke [-- http://localhost:5000]
require('dotenv').config({ quiet: true });

const BASE = `${process.argv[2] || `http://localhost:${process.env.PORT || 5000}`}/api/v1`;
const suffix = Date.now().toString(36).slice(-5).toUpperCase();

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

let failures = 0;
function check(label, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures += 1;
}

async function main() {
  const admin = await call('POST', '/auth/login', { body: { username: 'admin1', password: process.env.SEED_ADMIN_PASSWORD } });
  check('FR-01 admin logs in', admin.status === 200 && admin.body.user.role === 'ADMIN');
  const att = await call('POST', '/auth/login', { body: { username: 'att1', password: process.env.SEED_ATTENDANT_PASSWORD } });
  check('FR-01 attendant logs in', att.status === 200 && att.body.user.role === 'ATTENDANT');
  const bad = await call('POST', '/auth/login', { body: { username: 'att1', password: 'wrong-password' } });
  check('FR-02 generic message', bad.status === 401 && bad.body.error.message === 'Invalid username or password');
  const A = admin.body.token;
  const T = att.body.token;

  const slotId = `S${suffix}`;
  const slot = await call('POST', '/slots', { token: A, body: { slotId, slotType: 'CAR' } });
  check('FR-08 admin adds a slot', slot.status === 201 && slot.body.status === 'AVAILABLE', slotId);
  const forbidden = await call('POST', '/slots', { token: T, body: { slotId: `X${suffix}`, slotType: 'CAR' } });
  check('FR-05 attendant cannot add a slot (403)', forbidden.status === 403);

  const regNo = `KA01${suffix}`;
  const veh = await call('POST', '/vehicles', { token: T, body: { regNo: regNo.toLowerCase(), vehicleType: 'CAR' } });
  check('FR-06 register vehicle (stored upper case)', veh.status === 201 && veh.body.regNo === regNo, regNo);
  const dup = await call('POST', '/vehicles', { token: T, body: { regNo, vehicleType: 'CAR' } });
  check('FR-07 duplicate rejected, field named', dup.status === 409 && dup.body.error.field === 'regNo');

  const entry = await call('POST', '/parking/entry', { token: T, body: { regNo, slotId } });
  check('FR-11/12/14 entry with ticket', entry.status === 201 && entry.body.slotId === slotId, entry.body.ticketNo);
  const again = await call('POST', '/parking/entry', { token: T, body: { regNo } });
  check('FR-11 already parked rejected', again.status === 409);

  const sum = await call('GET', '/slots/summary', { token: T });
  check('FR-10 slot summary', sum.status === 200 && sum.body.byType.some((t) => t.slotType === 'CAR' && t.occupied >= 1));
  const search = await call('GET', `/vehicles/search?regNo=${regNo}`, { token: T });
  check('FR-20/21 search shows Parked', search.status === 200 && search.body.current.status === 'PARKED' && search.body.current.slotId === slotId);

  const exit = await call('POST', '/parking/exit', { token: T, body: { regNo } });
  check('FR-15/16/17 exit summary with fee', exit.status === 200 && exit.body.fee === '0.00' && exit.body.hourlyRate === '30.00', `fee Rs ${exit.body && exit.body.fee}`);
  const confirm = await call('POST', `/parking/${entry.body.ticketNo}/confirm-exit`, { token: T });
  check('FR-18 confirm exit completes record', confirm.status === 200 && confirm.body.status === 'COMPLETED');
  const after = await call('GET', `/vehicles/search?regNo=${regNo}`, { token: T });
  check('FR-21 now Not Parked', after.body.current.status === 'NOT_PARKED');

  const out = await call('POST', '/auth/logout', { token: T });
  const reuse = await call('GET', '/auth/me', { token: T });
  check('FR-03 logout invalidates token', out.status === 200 && reuse.status === 401);

  console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll smoke checks passed');
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error('Smoke test could not run:', err.message);
  process.exit(1);
});
