const express = require('express');
const Joi = require('joi');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const vehicleService = require('../services/vehicleService');
const parkingService = require('../services/parkingService');
const { VEHICLE_TYPES } = require('../models/constants');

const router = express.Router();

// FR-06: 4-15 characters, letters and digits, hyphens and spaces allowed.
const REG_NO = /^(?=.*[A-Za-z0-9])[A-Za-z0-9 -]{4,15}$/;

const vehicleSchema = Joi.object({
  regNo: Joi.string().trim().pattern(REG_NO).required()
    .messages({ 'string.pattern.base': 'regNo must be 4 to 15 letters or digits (hyphens and spaces allowed)' }),
  vehicleType: Joi.string().valid(...VEHICLE_TYPES).required(),
  ownerContact: Joi.string().trim().pattern(/^\+?[0-9]{7,15}$/).allow('')
    .messages({ 'string.pattern.base': 'ownerContact must be a phone number of 7 to 15 digits' }),
});

router.use(authenticate);

// FR-06, FR-07
router.post('/', authorize('ATTENDANT', 'ADMIN'), validate(vehicleSchema), async (req, res, next) => {
  try {
    const vehicle = await vehicleService.register(req.body);
    res.status(201).json(vehicleService.toDto(vehicle));
  } catch (err) {
    next(err);
  }
});

// FR-20, FR-21, FR-22: search by registration number; current status and parking history (SAD SD-4)
const searchSchema = Joi.object({
  regNo: Joi.string().trim().pattern(REG_NO).required()
    .messages({ 'string.pattern.base': 'regNo must be 4 to 15 letters or digits (hyphens and spaces allowed)' }),
});

router.get('/search', authorize('ATTENDANT', 'ADMIN'), validate(searchSchema, 'query'), async (req, res, next) => {
  try {
    const vehicle = await vehicleService.findActiveByRegNo(req.validated.regNo);
    const [current, history] = await Promise.all([
      parkingService.currentStatus(vehicle._id),
      parkingService.history(vehicle._id),
    ]);
    res.json({ vehicle: vehicleService.toDto(vehicle), current, history });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.REG_NO = REG_NO;
