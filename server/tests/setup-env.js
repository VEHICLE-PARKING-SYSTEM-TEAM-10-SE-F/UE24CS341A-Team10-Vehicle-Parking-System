// Test-only configuration. Real secrets live in server/.env, which is never committed.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-signing-secret-0123456789abcdef';
