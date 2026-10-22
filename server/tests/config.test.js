// SEC-07: secrets come from environment configuration; the server won't start without them.
const env = require('../src/config/env');

describe('SEC-07 environment configuration (TC-SEC-07)', () => {
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });

  it('refuses to run without JWT_SECRET', () => {
    delete process.env.JWT_SECRET;
    expect(() => env.jwtSecret()).toThrow(/JWT_SECRET/);
  });

  it('refuses a short JWT_SECRET', () => {
    process.env.JWT_SECRET = 'too-short';
    expect(() => env.jwtSecret()).toThrow(/at least 32/);
  });

  it('refuses to run without MONGODB_URI', () => {
    delete process.env.MONGODB_URI;
    expect(() => env.mongodbUri()).toThrow(/MONGODB_URI/);
  });
});
