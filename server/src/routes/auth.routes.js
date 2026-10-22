const express = require('express');
const Joi = require('joi');
const authService = require('../services/authService');
const authenticate = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');

const router = express.Router();

const loginSchema = Joi.object({
  username: Joi.string().trim().min(1).max(30).required(),
  password: Joi.string().min(1).max(128).required(),
});

// FR-01, FR-02
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    res.json(await authService.login(req.body.username, req.body.password));
  } catch (err) {
    next(err);
  }
});

// FR-03
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await authService.logout(req.session.jti);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});

// Who am I - used by the client to show user name and role on every screen (SRS 3.1).
router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

module.exports = router;
