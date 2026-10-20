const fs = require('fs');
const http = require('http');
const https = require('https');
const env = require('./config/env');
const { connect } = require('./db');
const { createApp } = require('./app');
const logger = require('./utils/logger');

// SEC-04: TLS 1.2 is the lowest protocol version accepted.
const TLS_OPTIONS = { minVersion: 'TLSv1.2' };

// Plain HTTP only redirects to HTTPS.
function redirectToHttps(httpsPort) {
  return (req, res) => {
    const host = (req.headers.host || 'localhost').replace(/:\d+$/, '');
    res.writeHead(301, { Location: `https://${host}:${httpsPort}${req.url}` });
    res.end();
  };
}

function startHttpsServer(app) {
  https.createServer({
    ...TLS_OPTIONS,
    cert: fs.readFileSync(env.tlsCertFile),
    key: fs.readFileSync(env.tlsKeyFile),
  }, app).listen(env.httpsPort, () => logger.info(`API listening on https://localhost:${env.httpsPort}/api/v1 (TLS 1.2+)`));
  http.createServer(redirectToHttps(env.httpsPort))
    .listen(env.port, () => logger.info(`HTTP on :${env.port} redirects to HTTPS`));
}

async function main() {
  env.jwtSecret(); // fail fast if the token-signing secret is missing (SEC-07)
  await connect(env.mongodbUri());
  if (env.tlsCertFile && env.tlsKeyFile) {
    startHttpsServer(createApp({ requireHttps: true }));
  } else {
    // Development, or deployment behind Nginx, which terminates TLS (docs/Deployment.md).
    createApp().listen(env.port, () => logger.info(`API listening on http://localhost:${env.port}/api/v1`));
  }
}

if (require.main === module) {
  main().catch((err) => {
    logger.error('Failed to start server', { message: err.message });
    process.exit(1);
  });
}

module.exports = { TLS_OPTIONS, redirectToHttps };
