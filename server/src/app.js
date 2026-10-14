const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const { corsOrigin } = require('./config/env');
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  // Access log: method, path, status, duration - never the body.
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => logger.info('request', {
      method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - start,
    }));
    next();
  });

  const api = express.Router();
  api.get('/health', (req, res) => {
    res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'up' : 'down' });
  });
  app.use('/api/v1', api);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
