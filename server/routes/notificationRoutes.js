/**
 * Notification Routes
 * GET   /api/notifications              - Get user's notifications
 * GET   /api/notifications/unread-count  - Get unread count
 * PATCH /api/notifications/read-all     - Mark all as read
 * PATCH /api/notifications/:id/read     - Mark one as read
 */
const express = require('express');
const router = express.Router();
const { getNotifications, markAllRead, markOneRead, getUnreadCount } = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markOneRead);

module.exports = router;
