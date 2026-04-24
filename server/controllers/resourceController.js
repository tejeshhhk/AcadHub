/**
 * Resource Controller
 * Handles CRUD operations for academic resources, ratings, bookmarks, trending, and reports
 */
const Resource = require('../models/Resource');
const User = require('../models/User');
const Report = require('../models/Report');
const { generateSummary } = require('../services/aiService');
const { createNotification } = require('./notificationController');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');


/**
 * POST /api/resources/upload
 * Upload a new academic resource
 */

const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};
const uploadResource = async (req, res) => {
    try {
        const { title, description, subject, topic, visibility } = req.body;

        // Validate input
        if (!title || !description || !subject) {
            return res.status(400).json({
                success: false,
                message: 'Please provide title, description, and subject.'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file.'
            });
        }

        // Determine file type from mimetype
        let fileType = 'document';
        if (req.file.mimetype.startsWith('image/')) fileType = 'image';
        else if (req.file.mimetype.startsWith('video/')) fileType = 'video';
        else if (req.file.mimetype === 'application/pdf') fileType = 'pdf';
        else if (req.file.mimetype.includes('presentation') || req.file.mimetype.includes('powerpoint')) fileType = 'presentation';

        // Upload file to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer);

        // Create resource
        const resource = await Resource.create({
            title,
            description,
            subject,
            topic: topic || '',
            fileUrl: result.secure_url,
            fileType,
            visibility: visibility || 'public',
            uploadedBy: req.user._id
        });

        // Generate AI summary asynchronously (don't block the response)
        generateSummary(title, description, subject).then(async (summary) => {
            resource.summary = summary;
            await resource.save();
        }).catch(err => console.error('Summary generation failed:', err));

        // Populate uploader info
        await resource.populate('uploadedBy', 'name email');

        res.status(201).json({
            success: true,
            message: 'Resource uploaded successfully! AI summary is being generated.',
            resource
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during upload.'
        });
    }
};

/**
 * GET /api/resources
 * List resources with pagination, filtering, and sorting
 */
const getResources = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 12, 
            subject, 
            topic, 
            sort = 'newest',
            search,
            user
        } = req.query;

        // Build filter query
        const filter = { isHidden: false };
        if (subject) filter.subject = new RegExp(subject, 'i');
        if (topic) filter.topic = new RegExp(topic, 'i');
        if (user) filter.uploadedBy = user;
        if (search) {
            filter.$text = { $search: search };
        }

        // Handle visibility
        if (req.user) {
            filter.$or = [
                { visibility: { $ne: 'private' } },
                { uploadedBy: req.user._id }
            ];
        } else {
            filter.visibility = { $ne: 'private' };
        }

        // Build sort query
        let sortQuery = {};
        switch (sort) {
            case 'newest': sortQuery = { createdAt: -1 }; break;
            case 'oldest': sortQuery = { createdAt: 1 }; break;
            case 'rating': sortQuery = { averageRating: -1 }; break;
            case 'views': sortQuery = { views: -1 }; break;
            case 'downloads': sortQuery = { downloads: -1 }; break;
            case 'score': sortQuery = { score: -1 }; break;
            default: sortQuery = { createdAt: -1 };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const resources = await Resource.find(filter)
            .sort(sortQuery)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('uploadedBy', 'name');

        const total = await Resource.countDocuments(filter);

        res.json({
            success: true,
            resources,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total
            }
        });
    } catch (error) {
        console.error('Get Resources Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching resources.'
        });
    }
};

/**
 * GET /api/resources/trending
 * Get trending resources based on views in the last 24 hours
 */
const getTrending = async (req, res) => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const resources = await Resource.aggregate([
            { $match: { isHidden: false, visibility: { $ne: 'private' } } },
            {
                $addFields: {
                    recentViews: {
                        $size: {
                            $filter: {
                                input: '$viewHistory',
                                as: 'view',
                                cond: { $gte: ['$$view.viewedAt', twentyFourHoursAgo] }
                            }
                        }
                    }
                }
            },
            { $sort: { recentViews: -1, score: -1 } },
            { $limit: 10 }
        ]);

        // Populate uploadedBy
        await Resource.populate(resources, { path: 'uploadedBy', select: 'name' });

        res.json({
            success: true,
            resources
        });
    } catch (error) {
        console.error('Trending Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching trending resources.'
        });
    }
};

/**
 * GET /api/resources/:id
 * Get a single resource by ID, increment views and track study history
 */
const getResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id)
            .populate('uploadedBy', 'name email');

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found.'
            });
        }

        if (resource.isHidden) {
            return res.status(404).json({
                success: false,
                message: 'This resource is currently unavailable.'
            });
        }

        if (resource.visibility === 'private') {
            if (!req.user || req.user._id.toString() !== resource.uploadedBy._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'This resource is private and can only be viewed by its creator.'
                });
            }
        }

        // Increment views and add to view history
        resource.views += 1;
        resource.viewHistory.push({ viewedAt: new Date() });
        resource.calculateScore();
        await resource.save();

        // If user is authenticated, add to study history
        if (req.user) {
            const user = await User.findById(req.user._id);
            user.studyHistory.push({ resourceId: resource._id, viewedAt: new Date() });
            // Keep only last 100 entries
            if (user.studyHistory.length > 100) {
                user.studyHistory = user.studyHistory.slice(-100);
            }
            await user.save();
        }

        res.json({
            success: true,
            resource
        });
    } catch (error) {
        console.error('Get Resource Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching resource.'
        });
    }
};

/**
 * DELETE /api/resources/:id
 * Delete a resource (owner or admin)
 */
const deleteResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found.'
            });
        }

        // Check permission: owner or admin
        if (resource.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this resource.'
            });
        }

        await Resource.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Resource deleted successfully.'
        });
    } catch (error) {
        console.error('Delete Resource Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting resource.'
        });
    }
};

/**
 * POST /api/resources/:id/rate
 * Rate a resource (1-5 stars)
 */
const rateResource = async (req, res) => {
    try {
        const { rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5.'
            });
        }

        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found.'
            });
        }

        // Check if user already rated
        const existingRating = resource.ratings.find(
            r => r.userId.toString() === req.user._id.toString()
        );

        if (existingRating) {
            existingRating.rating = rating;
        } else {
            resource.ratings.push({ userId: req.user._id, rating });
        }

        // Recalculate average and score
        resource.calculateAverageRating();
        resource.calculateScore();
        await resource.save();

        res.json({
            success: true,
            message: 'Rating submitted successfully.',
            averageRating: resource.averageRating,
            totalRatings: resource.ratings.length,
            score: resource.score
        });

        // Notify resource owner about the rating
        createNotification({
            userId: resource.uploadedBy,
            type: 'rating',
            title: 'New Rating',
            message: `${req.user.name} rated your resource "${resource.title}" ${rating} star${rating > 1 ? 's' : ''}.`,
            resourceId: resource._id,
            fromUser: req.user._id
        });
    } catch (error) {
        console.error('Rate Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error submitting rating.'
        });
    }
};

/**
 * POST /api/resources/:id/bookmark
 * Toggle bookmark on a resource
 */
const toggleBookmark = async (req, res) => {
    try {
        const resourceId = req.params.id;

        // Verify resource exists
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found.'
            });
        }

        const user = await User.findById(req.user._id);
        const bookmarkIndex = user.bookmarks.indexOf(resourceId);

        let isBookmarked;
        if (bookmarkIndex > -1) {
            // Remove bookmark
            user.bookmarks.splice(bookmarkIndex, 1);
            isBookmarked = false;
        } else {
            // Add bookmark
            user.bookmarks.push(resourceId);
            isBookmarked = true;
        }

        await user.save();

        res.json({
            success: true,
            message: isBookmarked ? 'Resource bookmarked!' : 'Bookmark removed.',
            isBookmarked
        });
    } catch (error) {
        console.error('Bookmark Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error toggling bookmark.'
        });
    }
};

/**
 * POST /api/resources/:id/download
 * Track resource download
 */
const trackDownload = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found.'
            });
        }

        resource.downloads += 1;
        resource.calculateScore();
        await resource.save();

        // Add to user's download history
        if (req.user) {
            const user = await User.findById(req.user._id);
            if (!user.downloads.includes(resource._id)) {
                user.downloads.push(resource._id);
                await user.save();
            }
        }

        res.json({
            success: true,
            message: 'Download tracked.',
            downloads: resource.downloads
        });

        // Notify resource owner about the download
        createNotification({
            userId: resource.uploadedBy,
            type: 'download',
            title: 'Resource Downloaded',
            message: `${req.user ? req.user.name : 'Someone'} downloaded your resource "${resource.title}".`,
            resourceId: resource._id,
            fromUser: req.user ? req.user._id : undefined
        });
    } catch (error) {
        console.error('Download Track Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error tracking download.'
        });
    }
};

/**
 * POST /api/resources/:id/report
 * Report a resource
 */
const reportResource = async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a reason for the report.'
            });
        }

        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found.'
            });
        }

        // Check for duplicate reports
        const existingReport = await Report.findOne({
            resourceId: req.params.id,
            reportedBy: req.user._id,
            status: 'pending'
        });

        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: 'You have already reported this resource.'
            });
        }

        await Report.create({
            resourceId: req.params.id,
            reportedBy: req.user._id,
            reason
        });

        res.json({
            success: true,
            message: 'Report submitted successfully. An admin will review it.'
        });

        // Notify all admins about the report
        const admins = await User.find({ role: 'admin' }).select('_id');
        for (const admin of admins) {
            createNotification({
                userId: admin._id,
                type: 'report',
                title: 'New Report',
                message: `${req.user.name} reported "${resource.title}": ${reason.substring(0, 80)}`,
                resourceId: resource._id,
                fromUser: req.user._id
            });
        }
    } catch (error) {
        console.error('Report Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error submitting report.'
        });
    }
};

module.exports = {
    uploadResource,
    getResources,
    getTrending,
    getResource,
    deleteResource,
    rateResource,
    toggleBookmark,
    trackDownload,
    reportResource
};
