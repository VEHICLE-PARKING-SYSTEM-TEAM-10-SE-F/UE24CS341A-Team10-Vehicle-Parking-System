// Reads configuration from environment variables (.env in development).
// Secrets are never hard-coded; the server refuses to start without them (SRS SEC-07).
require('dotenv').config({ quiet: true });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. Copy server/.env.example to server/.env.`);
  }
  return value;
}

function jwtSecret() {
  const value = required('JWT_SECRET');
  if (value.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long.');
  }
  return value;
}

module.exports = {
  required,
  jwtSecret,
  port: Number(process.env.PORT || 5000),
  mongodbUri: () => required('MONGODB_URI'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  // SEC-04 (deployment): HTTPS settings - see docs/Deployment.md.
  requireHttps: process.env.REQUIRE_HTTPS === 'true',
  trustProxy: process.env.TRUST_PROXY === 'true',
  tlsCertFile: process.env.TLS_CERT_FILE || null,
  tlsKeyFile: process.env.TLS_KEY_FILE || null,
  httpsPort: Number(process.env.HTTPS_PORT || 5443),
};
