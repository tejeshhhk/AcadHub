/**
 * AI Routes (Groq)
 * POST /api/ai/generate-summary   - Generate AI summary
 * POST /api/ai/recommendations    - Get personalized recommendations
 * POST /api/ai/smart-search       - AI-enhanced search
 */
const express = require('express');
const router = express.Router();
const {
    generateResourceSummary,
    getSmartRecommendations,
    smartSearch
} = require('../controllers/aiController');
const auth = require('../middleware/auth');

// All AI routes require authentication
router.post('/generate-summary', auth, generateResourceSummary);
router.post('/recommendations', auth, getSmartRecommendations);
router.post('/smart-search', auth, smartSearch);

module.exports = router;
