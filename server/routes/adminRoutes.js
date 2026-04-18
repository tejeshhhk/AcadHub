/**
 * Admin Routes
 * All routes require authentication + admin role
 */
const express = require('express');
const router = express.Router();
const {
    getStats,
    getUsers,
    deleteUser,
    changeUserRole,
    getAllResources,
    toggleHideResource,
    forceDeleteResource,
    getReports,
    updateReportStatus
} = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// All admin routes require auth + admin middleware
router.use(auth, admin);

// Dashboard statistics
router.get('/stats', getStats);

// User management
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/role', changeUserRole);

// Resource management
router.get('/resources', getAllResources);
router.patch('/resources/:id/hide', toggleHideResource);
router.delete('/resources/:id', forceDeleteResource);

// Report management
router.get('/reports', getReports);
router.patch('/reports/:id', updateReportStatus);

module.exports = router;
