/**
 * Comment Controller
 * Handles comments and replies on resources
 */
const Comment = require('../models/Comment');
const Resource = require('../models/Resource');
const { createNotification } = require('./notificationController');

/**
 * POST /api/comments
 * Add a comment to a resource
 */
const addComment = async (req, res) => {
    try {
        const { resourceId, comment } = req.body;

        if (!resourceId || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Resource ID and comment text are required.'
            });
        }

        // Verify resource exists
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found.'
            });
        }

        const newComment = await Comment.create({
            resourceId,
            userId: req.user._id,
            comment
        });

        // Populate user info
        await newComment.populate('userId', 'name avatar');

        res.status(201).json({
            success: true,
            message: 'Comment added successfully.',
            comment: newComment
        });

        // Notify resource owner about the comment
        createNotification({
            userId: resource.uploadedBy,
            type: 'comment',
            title: 'New Comment',
            message: `${req.user.name} commented on "${resource.title}": "${comment.substring(0, 60)}..."`,
            resourceId: resource._id,
            fromUser: req.user._id
        });
    } catch (error) {
        console.error('Add Comment Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding comment.'
        });
    }
};

/**
 * GET /api/comments/:resourceId
 * Get all comments for a resource
 */
const getComments = async (req, res) => {
    try {
        const comments = await Comment.find({ resourceId: req.params.resourceId })
            .populate('userId', 'name avatar')
            .populate('replies.userId', 'name avatar')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            comments
        });
    } catch (error) {
        console.error('Get Comments Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching comments.'
        });
    }
};

/**
 * POST /api/comments/:id/reply
 * Add a reply to an existing comment
 */
const addReply = async (req, res) => {
    try {
        const { reply } = req.body;

        if (!reply) {
            return res.status(400).json({
                success: false,
                message: 'Reply text is required.'
            });
        }

        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found.'
            });
        }

        comment.replies.push({
            userId: req.user._id,
            reply,
            createdAt: new Date()
        });

        await comment.save();

        // Re-populate and return
        await comment.populate('userId', 'name avatar');
        await comment.populate('replies.userId', 'name avatar');

        res.json({
            success: true,
            message: 'Reply added successfully.',
            comment
        });

        // Notify the original comment owner about the reply
        createNotification({
            userId: comment.userId._id || comment.userId,
            type: 'reply',
            title: 'New Reply',
            message: `${req.user.name} replied to your comment: "${reply.substring(0, 60)}..."`,
            resourceId: comment.resourceId,
            fromUser: req.user._id
        });
    } catch (error) {
        console.error('Add Reply Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding reply.'
        });
    }
};

/**
 * DELETE /api/comments/:id
 * Delete a comment (owner or admin only)
 */
const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found.'
            });
        }

        // Check permission
        if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this comment.'
            });
        }

        await Comment.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Comment deleted successfully.'
        });
    } catch (error) {
        console.error('Delete Comment Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting comment.'
        });
    }
};

module.exports = { addComment, getComments, addReply, deleteComment };
