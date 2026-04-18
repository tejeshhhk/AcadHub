/**
 * Admin Controller
 * Handles admin-only operations: user management, resource moderation, reports, and stats
 */
const User = require('../models/User');
const Resource = require('../models/Resource');
const Report = require('../models/Report');
const Comment = require('../models/Comment');

/**
 * GET /api/admin/stats
 * Get platform statistics for admin dashboard
 */
const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalResources = await Resource.countDocuments();
        const totalComments = await Comment.countDocuments();
        const pendingReports = await Report.countDocuments({ status: 'pending' });
        const hiddenResources = await Resource.countDocuments({ isHidden: true });

        // Get recent activity (last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });
        const newResourcesThisWeek = await Resource.countDocuments({ createdAt: { $gte: weekAgo } });

        // Top subjects
        const topSubjects = await Resource.aggregate([
            { $group: { _id: '$subject', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalResources,
                totalComments,
                pendingReports,
                hiddenResources,
                newUsersThisWeek,
                newResourcesThisWeek,
                topSubjects
            }
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching stats.'
        });
    }
};

/**
 * GET /api/admin/users
 * List all users
 */
const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Get Users Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching users.'
        });
    }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user account
 */
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Don't allow deleting self
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account from the admin panel.'
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'User deleted successfully.'
        });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting user.'
        });
    }
};

/**
 * PATCH /api/admin/users/:id/role
 * Change a user's role
 */
const changeUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be either "user" or "admin".'
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: `User role changed to ${role} successfully.`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Change Role Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error changing user role.'
        });
    }
};

/**
 * GET /api/admin/resources
 * List all resources including hidden ones
 */
const getAllResources = async (req, res) => {
    try {
        const resources = await Resource.find()
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            resources
        });
    } catch (error) {
        console.error('Admin Get Resources Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching resources.'
        });
    }
};

/**
 * PATCH /api/admin/resources/:id/hide
 * Toggle resource visibility
 */
const toggleHideResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found.'
            });
        }

        resource.isHidden = !resource.isHidden;
        await resource.save();

        res.json({
            success: true,
            message: resource.isHidden ? 'Resource is now hidden.' : 'Resource is now visible.',
            isHidden: resource.isHidden
        });
    } catch (error) {
        console.error('Hide Resource Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error toggling resource visibility.'
        });
    }
};

/**
 * DELETE /api/admin/resources/:id
 * Force delete a resource
 */
const forceDeleteResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found.'
            });
        }

        // Delete associated comments and reports
        await Comment.deleteMany({ resourceId: req.params.id });
        await Report.deleteMany({ resourceId: req.params.id });
        await Resource.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Resource and associated data deleted successfully.'
        });
    } catch (error) {
        console.error('Force Delete Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting resource.'
        });
    }
};

/**
 * GET /api/admin/reports
 * List all reports
 */
const getReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('resourceId', 'title subject')
            .populate('reportedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            reports
        });
    } catch (error) {
        console.error('Get Reports Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching reports.'
        });
    }
};

/**
 * PATCH /api/admin/reports/:id
 * Update report status (resolve or dismiss)
 */
const updateReportStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['resolved', 'dismissed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be "resolved" or "dismissed".'
            });
        }

        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found.'
            });
        }

        report.status = status;
        await report.save();

        res.json({
            success: true,
            message: `Report ${status} successfully.`,
            report
        });
    } catch (error) {
        console.error('Update Report Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating report.'
        });
    }
};

module.exports = {
    getStats,
    getUsers,
    deleteUser,
    changeUserRole,
    getAllResources,
    toggleHideResource,
    forceDeleteResource,
    getReports,
    updateReportStatus
};
