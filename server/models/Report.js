/**
 * Report Model
 * Stores user reports for inappropriate or incorrect resources
 */
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource',
        required: [true, 'Resource ID is required']
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Reporter user ID is required']
    },
    reason: {
        type: String,
        required: [true, 'Report reason is required'],
        trim: true,
        maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
