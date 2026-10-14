const express = require('express');
const Joi = require('joi');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const slotService = require('../services/slotService');
const { VEHICLE_TYPES } = require('../models/constants');

const router = express.Router();

const slotSchema = Joi.object({
  slotId: Joi.string().trim().pattern(/^[A-Za-z0-9-]{1,12}$/).required()
    .messages({ 'string.pattern.base': 'slotId must be 1 to 12 letters, digits or hyphens (e.g. A-01)' }),
  slotType: Joi.string().valid(...VEHICLE_TYPES).required(),
});

router.use(authenticate);

// FR-10: every slot with its status, and Available / Occupied counts per type (all logged-in users)
router.get('/', authorize('ATTENDANT', 'ADMIN'), async (req, res, next) => {
  try {
    res.json({ slots: (await slotService.listSlots()).map(slotService.toDto) });
  } catch (err) {
    next(err);
  }
});

router.get('/summary', authorize('ATTENDANT', 'ADMIN'), async (req, res, next) => {
  try {
    res.json(await slotService.summary());
  } catch (err) {
    next(err);
  }
});

// FR-08 (Administrator only - BR-05)
router.post('/', authorize('ADMIN'), validate(slotSchema), async (req, res, next) => {
  try {
    const slot = await slotService.createSlot(req.body);
    res.status(201).json(slotService.toDto(slot));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
