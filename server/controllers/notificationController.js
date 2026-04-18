/**
 * Notification Controller
 * Handles fetching, marking read, and creating notifications
 */
const Notification = require('../models/Notification');

/**
 * GET /api/notifications
 * Get current user's notifications (latest 50)
 */
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .populate('fromUser', 'name')
            .populate('resourceId', 'title')
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ 
            userId: req.user._id, 
            isRead: false 
        });

        res.json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching notifications.'
        });
    }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, isRead: false },
            { isRead: true }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read.'
        });
    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error marking notifications.'
        });
    }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
const markOneRead = async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isRead: true }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Mark One Read Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
};

/**
 * GET /api/notifications/unread-count
 * Get unread notification count (lightweight endpoint for polling)
 */
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ 
            userId: req.user._id, 
            isRead: false 
        });
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, count: 0 });
    }
};

/**
 * Helper: Create a notification (called from other controllers)
 * @param {Object} options - { userId, type, title, message, resourceId, fromUser }
 */
const createNotification = async ({ userId, type, title, message, resourceId, fromUser }) => {
    try {
        // Don't notify yourself
        if (fromUser && userId && fromUser.toString() === userId.toString()) return;

        await Notification.create({
            userId,
            type,
            title,
            message,
            resourceId: resourceId || undefined,
            fromUser: fromUser || undefined
        });
    } catch (error) {
        console.error('Create Notification Error:', error);
    }
};

module.exports = { getNotifications, markAllRead, markOneRead, getUnreadCount, createNotification };
