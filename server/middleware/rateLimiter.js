/**
 * Rate Limiter Middleware
 * Prevents abuse by limiting requests per IP address
 */
const rateLimit = require('express-rate-limit');

// General API rate limiter: 1000 requests per 15 minutes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Stricter limiter for auth routes: 20 requests per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { apiLimiter, authLimiter };
