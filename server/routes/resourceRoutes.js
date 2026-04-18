/**
 * Resource Routes
 * Handles all resource-related endpoints
 */
const express = require('express');
const router = express.Router();
const {
    uploadResource,
    getResources,
    getTrending,
    getResource,
    deleteResource,
    rateResource,
    toggleBookmark,
    trackDownload,
    reportResource
} = require('../controllers/resourceController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getResources);
router.get('/trending', getTrending);

// The :id routes need to be after specific named routes
router.get('/:id', optionalAuth, getResource);

// Protected routes (require authentication)
router.post('/upload', auth, upload.single('file'), uploadResource);
router.delete('/:id', auth, deleteResource);
router.post('/:id/rate', auth, rateResource);
router.post('/:id/bookmark', auth, toggleBookmark);
router.post('/:id/download', auth, trackDownload);
router.post('/:id/report', auth, reportResource);

/**
 * Optional auth middleware - attaches user if token present, but doesn't block
 */
function optionalAuth(req, res, next) {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    
    try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        User.findById(decoded.userId).select('-password').then(user => {
            req.user = user;
            next();
        }).catch(() => next());
    } catch {
        next();
    }
}

module.exports = router;
