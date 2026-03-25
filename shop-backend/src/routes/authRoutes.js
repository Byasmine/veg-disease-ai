const express = require('express');
const { registerPendingProfile, verifyLogin, changePassword, fetchUserById } = require('../services/authService');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const result = await registerPendingProfile(req.body || {});
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const result = await verifyLogin(email, password);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const result = await changePassword(req.user.id, currentPassword, newPassword);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await fetchUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    return res.json({ user });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
