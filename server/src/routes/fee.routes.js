const express = require('express');
const Joi = require('joi');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const feeService = require('../services/feeService');
const { VEHICLE_TYPES } = require('../models/constants');

const router = express.Router();

// FR-19: rate in rupees, a number >= 0 with at most two decimals.
const ratesSchema = Joi.object({
  rates: Joi.array().min(1).max(VEHICLE_TYPES.length).unique('vehicleType').items(Joi.object({
    vehicleType: Joi.string().valid(...VEHICLE_TYPES).required(),
    hourlyRate: Joi.number().strict().min(0).max(100000).precision(2).required()
      .messages({ 'number.base': 'hourlyRate must be a number', 'number.min': 'hourlyRate must be 0 or more' }),
  })).required(),
});

router.use(authenticate);

router.get('/', authorize('ATTENDANT', 'ADMIN'), async (req, res, next) => {
  try {
    res.json(await feeService.listRates());
  } catch (err) {
    next(err);
  }
});

// FR-19 (Administrator only - BR-05)
router.put('/', authorize('ADMIN'), validate(ratesSchema), async (req, res, next) => {
  try {
    res.json(await feeService.setRates(req.body.rates, req.user.id));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
