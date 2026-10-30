const express = require('express');
const Joi = require('joi');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const userService = require('../services/userService');
const { ROLES } = require('../models/User');

const router = express.Router();

const username = Joi.string().trim().pattern(/^[A-Za-z0-9._-]{3,30}$/)
  .messages({ 'string.pattern.base': 'username must be 3 to 30 letters, digits, dot, dash or underscore' });
const password = Joi.string().min(8).max(128)
  .messages({ 'string.min': 'password must be at least 8 characters' });
const name = Joi.string().trim().min(1).max(60);
const role = Joi.string().valid(...ROLES);

const createSchema = Joi.object({ username: username.required(), name: name.required(), password: password.required(), role: role.required() });
const updateSchema = Joi.object({ name, role, password }).min(1);
const statusSchema = Joi.object({ active: Joi.boolean().strict().required() });
const idSchema = Joi.object({ userId: Joi.string().hex().length(24).required() });

// FR-04 / BR-05: user management is for Administrators only.
router.use(authenticate, authorize('ADMIN'));

router.get('/', async (req, res, next) => {
  try {
    res.json({ users: (await userService.list()).map(userService.toDto) });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    res.status(201).json(userService.toDto(await userService.create(req.body)));
  } catch (err) {
    next(err);
  }
});

router.put('/:userId', validate(idSchema, 'params'), validate(updateSchema), async (req, res, next) => {
  try {
    res.json(userService.toDto(await userService.update(req.params.userId, req.body, req.user.id)));
  } catch (err) {
    next(err);
  }
});

router.patch('/:userId/status', validate(idSchema, 'params'), validate(statusSchema), async (req, res, next) => {
  try {
    res.json(userService.toDto(await userService.setActive(req.params.userId, req.body.active, req.user.id)));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
