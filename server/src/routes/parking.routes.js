const express = require('express');
const Joi = require('joi');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const parkingService = require('../services/parkingService');
const { REG_NO } = require('./vehicle.routes');

const router = express.Router();

const regNo = Joi.string().trim().pattern(REG_NO).required()
  .messages({ 'string.pattern.base': 'regNo must be 4 to 15 letters or digits (hyphens and spaces allowed)' });

const entrySchema = Joi.object({
  regNo,
  slotId: Joi.string().trim().pattern(/^[A-Za-z0-9-]{1,12}$/).allow(''),
});
const exitSchema = Joi.object({ regNo });

router.use(authenticate, authorize('ATTENDANT', 'ADMIN'));

// FR-11 – FR-14
router.post('/entry', validate(entrySchema), async (req, res, next) => {
  try {
    const record = await parkingService.recordEntry(req.body, req.user);
    res.status(201).json(parkingService.toDto(record));
  } catch (err) {
    next(err);
  }
});

// FR-15
router.post('/exit', validate(exitSchema), async (req, res, next) => {
  try {
    const record = await parkingService.recordExit(req.body);
    res.json(parkingService.toDto(record));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
