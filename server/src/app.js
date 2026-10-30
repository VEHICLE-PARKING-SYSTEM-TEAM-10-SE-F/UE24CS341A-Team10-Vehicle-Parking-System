const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const { corsOrigin, requireHttps, trustProxy } = require('./config/env');
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { rejectUnsafeInput } = require('./middleware/validate');
const httpsOnly = require('./middleware/httpsOnly');
const authRoutes = require('./routes/auth.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const slotRoutes = require('./routes/slot.routes');
const parkingRoutes = require('./routes/parking.routes');
const userRoutes = require('./routes/user.routes');
const feeRoutes = require('./routes/fee.routes');
const reportRoutes = require('./routes/report.routes');

function createApp(options = {}) {
  const app = express();
  app.disable('x-powered-by');
  // Behind Nginx (SAD §3.10) the TLS connection ends at the proxy; trust its X-Forwarded-Proto.
  if (options.trustProxy ?? trustProxy) app.set('trust proxy', 1);
  // SEC-04: in deployment every request must arrive over HTTPS (HTTP is redirected).
  if (options.requireHttps ?? requireHttps) app.use(httpsOnly);
  app.use(helmet({ hsts: { maxAge: 31536000, includeSubDomains: true } }));
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
  api.use(rejectUnsafeInput); // SEC-05: no database operators or script content anywhere
  api.get('/health', (req, res) => {
    res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'up' : 'down' });
  });
  api.use('/auth', authRoutes);
  api.use('/vehicles', vehicleRoutes);
  api.use('/slots', slotRoutes);
  api.use('/parking', parkingRoutes);
  api.use('/users', userRoutes);
  api.use('/fee-rates', feeRoutes);
  api.use('/reports', reportRoutes);
  app.use('/api/v1', api);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
