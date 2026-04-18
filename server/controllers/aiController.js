/**
 * AI Controller (Groq)
 * Handles AI-powered features: summary generation, recommendations, and smart search
 */
const Resource = require('../models/Resource');
const User = require('../models/User');
const { generateSummary, getRecommendations, semanticSearch } = require('../services/aiService');

/**
 * POST /api/ai/generate-summary
 * Generate AI summary for a specific resource
 */
const generateResourceSummary = async (req, res) => {
    try {
        const { resourceId } = req.body;

        if (!resourceId) {
            return res.status(400).json({
                success: false,
                message: 'Resource ID is required.'
            });
        }

        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found.'
            });
        }

        // Generate summary using Gemini
        const summary = await generateSummary(
            resource.title,
            resource.description,
            resource.subject
        );

        // Save summary to resource
        resource.summary = summary;
        await resource.save();

        res.json({
            success: true,
            message: 'Summary generated successfully.',
            summary
        });
    } catch (error) {
        console.error('Generate Summary Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error generating summary.'
        });
    }
};

/**
 * POST /api/ai/recommendations
 * Get personalized resource recommendations for the authenticated user
 */
const getSmartRecommendations = async (req, res) => {
    try {
        // Get user with study history
        const user = await User.findById(req.user._id)
            .populate('studyHistory.resourceId', 'title subject topic')
            .populate('downloads', 'title subject topic');

        // Build user history context
        const subjects = {};
        const topics = {};
        const recentTitles = [];

        // Analyze study history
        if (user.studyHistory && user.studyHistory.length > 0) {
            user.studyHistory.slice(-20).forEach(entry => {
                if (entry.resourceId) {
                    const r = entry.resourceId;
                    subjects[r.subject] = (subjects[r.subject] || 0) + 1;
                    if (r.topic) topics[r.topic] = (topics[r.topic] || 0) + 1;
                    recentTitles.push(r.title);
                }
            });
        }

        // Analyze downloads
        if (user.downloads && user.downloads.length > 0) {
            user.downloads.forEach(r => {
                if (r) {
                    subjects[r.subject] = (subjects[r.subject] || 0) + 2;
                    if (r.topic) topics[r.topic] = (topics[r.topic] || 0) + 2;
                }
            });
        }

        const userHistory = {
            subjects: Object.keys(subjects).sort((a, b) => subjects[b] - subjects[a]).slice(0, 5),
            topics: Object.keys(topics).sort((a, b) => topics[b] - topics[a]).slice(0, 5),
            recentTitles: recentTitles.slice(-5)
        };

        // Get available resources (exclude hidden)
        const allResources = await Resource.find({ isHidden: false })
            .select('title subject topic description score')
            .sort({ score: -1 })
            .limit(50);

        // Get recommendations from Gemini
        const recommendedIds = await getRecommendations(userHistory, allResources);

        // Fetch full resource details for recommended IDs
        const recommended = await Resource.find({ 
            _id: { $in: recommendedIds },
            isHidden: false 
        }).populate('uploadedBy', 'name');

        // Sort by the order returned by Gemini
        const orderedRecommendations = recommendedIds
            .map(id => recommended.find(r => r._id.toString() === id))
            .filter(Boolean);

        res.json({
            success: true,
            recommendations: orderedRecommendations
        });
    } catch (error) {
        console.error('Recommendations Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting recommendations.'
        });
    }
};

/**
 * POST /api/ai/smart-search
 * Perform AI-enhanced semantic search
 */
const smartSearch = async (req, res) => {
    try {
        const { query } = req.body;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required.'
            });
        }

        // First, get resources using text search
        let resources = await Resource.find({
            isHidden: false,
            $text: { $search: query }
        })
        .select('title subject topic description score')
        .limit(30);

        // If text search returns too few results, fall back to regex
        if (resources.length < 5) {
            const regex = new RegExp(query.split(' ').join('|'), 'i');
            const additionalResources = await Resource.find({
                isHidden: false,
                $or: [
                    { title: regex },
                    { description: regex },
                    { subject: regex },
                    { topic: regex }
                ]
            })
            .select('title subject topic description score')
            .limit(30);

            // Merge without duplicates
            const existingIds = new Set(resources.map(r => r._id.toString()));
            additionalResources.forEach(r => {
                if (!existingIds.has(r._id.toString())) {
                    resources.push(r);
                }
            });
        }

        if (resources.length === 0) {
            return res.json({
                success: true,
                resources: [],
                message: 'No resources found matching your query.'
            });
        }

        // Use Gemini for semantic ranking
        const rankedIds = await semanticSearch(query, resources);

        // Fetch full details in ranked order
        const fullResources = await Resource.find({
            _id: { $in: rankedIds }
        }).populate('uploadedBy', 'name');

        const orderedResults = rankedIds
            .map(id => fullResources.find(r => r._id.toString() === id))
            .filter(Boolean);

        res.json({
            success: true,
            resources: orderedResults
        });
    } catch (error) {
        console.error('Smart Search Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during smart search.'
        });
    }
};

module.exports = {
    generateResourceSummary,
    getSmartRecommendations,
    smartSearch
};
