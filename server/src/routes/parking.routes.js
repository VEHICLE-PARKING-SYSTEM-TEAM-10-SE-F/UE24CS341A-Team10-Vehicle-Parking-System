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
const ticketSchema = Joi.object({ ticketNo: Joi.string().pattern(/^T-\d{8}-\d{4,}$/).required() });

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

// FR-15 – FR-17: record exit time, calculate fee, return the summary shown before confirmation
router.post('/exit', validate(exitSchema), async (req, res, next) => {
  try {
    res.json(parkingService.toSummary(await parkingService.recordExit(req.body)));
  } catch (err) {
    next(err);
  }
});

// FR-18: confirm the exit - record Completed with fee, slot Available
router.post('/:ticketNo/confirm-exit', validate(ticketSchema, 'params'), async (req, res, next) => {
  try {
    res.json(parkingService.toDto(await parkingService.confirmExit(req.params.ticketNo)));
  } catch (err) {
    next(err);
  }
});

// FR-17: the attendant cancels the summary; the record stays Active
router.post('/:ticketNo/cancel-exit', validate(ticketSchema, 'params'), async (req, res, next) => {
  try {
    res.json(parkingService.toDto(await parkingService.cancelExit(req.params.ticketNo)));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
