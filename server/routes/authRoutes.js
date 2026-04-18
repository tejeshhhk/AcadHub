/**
 * Auth Routes
 * POST /api/auth/register - Register new user
 * POST /api/auth/login    - Login user
 * GET  /api/auth/me       - Get current user profile
 */
const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes (with stricter rate limiting)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Protected route
router.get('/me', auth, getMe);

module.exports = router;
