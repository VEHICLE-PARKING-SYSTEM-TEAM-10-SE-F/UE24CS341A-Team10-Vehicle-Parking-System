const env = require('./config/env');
const { connect } = require('./db');
const { createApp } = require('./app');
const logger = require('./utils/logger');

async function main() {
  await connect(env.mongodbUri());
  const app = createApp();
  app.listen(env.port, () => logger.info(`API listening on http://localhost:${env.port}/api/v1`));
}

main().catch((err) => {
  logger.error('Failed to start server', { message: err.message });
  process.exit(1);
});
