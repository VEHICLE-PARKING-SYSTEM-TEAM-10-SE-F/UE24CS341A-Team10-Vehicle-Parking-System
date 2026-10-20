const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const reportService = require('../services/reportService');

const router = express.Router();

// FR-23 (Administrator only - BR-05)
router.get('/occupancy', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    res.json(await reportService.occupancy());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
