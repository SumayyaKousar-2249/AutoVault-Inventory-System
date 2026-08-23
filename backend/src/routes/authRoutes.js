'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me  — protected: requires valid Bearer JWT
router.get('/me', authenticate, (req, res) => {
  const { id, email, role } = req.user;
  return res.status(200).json({ user: { id, email, role } });
});

module.exports = router;
