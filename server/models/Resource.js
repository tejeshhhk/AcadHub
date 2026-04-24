/**
 * Resource Model
 * Stores academic resources with ratings, views, downloads, and AI-generated summaries
 */
const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    topic: {
        type: String,
        trim: true,
        default: ''
    },
    fileUrl: {
        type: String,
        required: [true, 'File URL is required']
    },
    fileType: {
        type: String,
        default: 'document'
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    ratings: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        }
    }],
    views: {
        type: Number,
        default: 0
    },
    downloads: {
        type: Number,
        default: 0
    },
    score: {
        type: Number,
        default: 0
    },
    summary: {
        type: String,
        default: ''
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    // Track views with timestamps for trending calculation
    viewHistory: [{
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Calculate resource score: (avgRating * 0.6) + (downloads * 0.2) + (views * 0.2)
resourceSchema.methods.calculateScore = function() {
    const ratingScore = this.averageRating * 0.6;
    const downloadScore = this.downloads * 0.2;
    const viewScore = this.views * 0.2;
    this.score = parseFloat((ratingScore + downloadScore + viewScore).toFixed(2));
    return this.score;
};

// Calculate average rating from ratings array
resourceSchema.methods.calculateAverageRating = function() {
    if (this.ratings.length === 0) {
        this.averageRating = 0;
        return 0;
    }
    const sum = this.ratings.reduce((acc, r) => acc + r.rating, 0);
    this.averageRating = parseFloat((sum / this.ratings.length).toFixed(1));
    return this.averageRating;
};

// Index for search functionality
resourceSchema.index({ title: 'text', description: 'text', subject: 'text', topic: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);
