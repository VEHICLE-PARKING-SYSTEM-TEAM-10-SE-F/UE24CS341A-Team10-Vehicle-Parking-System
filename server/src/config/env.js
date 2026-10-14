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

module.exports = {
  required,
  port: Number(process.env.PORT || 5000),
  mongodbUri: () => required('MONGODB_URI'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
};
