/**
 * AI Service (Groq Implementation)
 * Wrapper around Groq SDK for academic resource features
 */
const Groq = require('groq-sdk');

let groq = null;

/**
 * Initialize the Groq AI client
 */
const initAI = () => {
    if (!process.env.GROQ_API_KEY) {
        console.warn('⚠️  Groq API key not configured. AI features will return fallback responses.');
        return false;
    }
    try {
        groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
        console.log('✅ Groq AI initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Groq AI:', error.message);
        return false;
    }
};

/**
 * Generate a concise academic summary for a resource
 * @param {string} title - Resource title
 * @param {string} description - Resource description
 * @param {string} subject - Resource subject
 * @returns {string} Generated summary
 */
const generateSummary = async (title, description, subject) => {
    if (!groq) {
        return `This is a ${subject} resource titled "${title}". ${description.substring(0, 150)}...`;
    }

    try {
        const prompt = `You are an academic assistant. Generate a clear, concise, and informative summary (150-250 words) for the following academic resource. The summary should help students understand what they will learn from this resource.

Title: ${title}
Subject: ${subject}
Description: ${description}

Generate a well-structured summary with key learning points. Use simple language suitable for students. Do not use markdown formatting.`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Groq Summary Error:', error.message);
        return `This is a ${subject} resource titled "${title}". ${description.substring(0, 200)}`;
    }
};

/**
 * Get smart recommendations based on user activity
 * @param {object} userHistory - User's study history and preferences
 * @param {Array} availableResources - List of available resources
 * @returns {Array} Recommended resource IDs
 */
const getRecommendations = async (userHistory, availableResources) => {
    if (!groq || availableResources.length === 0) {
        return availableResources
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)
            .map(r => r._id.toString());
    }

    try {
        const viewedSubjects = userHistory.subjects || [];
        const viewedTopics = userHistory.topics || [];
        const recentViews = userHistory.recentTitles || [];

        const resourceList = availableResources.slice(0, 50).map((r, i) => 
            `${i}: "${r.title}" (Subject: ${r.subject}, Topic: ${r.topic || 'General'}, Score: ${r.score})`
        ).join('\n');

        const prompt = `You are a smart academic recommendation engine. Based on a student's activity, recommend the most relevant resources.

Student Activity:
- Frequently viewed subjects: ${viewedSubjects.join(', ') || 'None yet'}
- Topics of interest: ${viewedTopics.join(', ') || 'None yet'}
- Recently viewed: ${recentViews.join(', ') || 'None yet'}

Available Resources:
${resourceList}

Return ONLY a comma-separated list of resource index numbers (e.g., "0,3,5,12,7,2") for the top 6 most relevant resources for this student. Consider subject relevance, topic alignment, and resource quality (score). Return ONLY the numbers, nothing else.`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            temperature: 0.1, // Low temperature for consistent formatting
        });

        const text = completion.choices[0].message.content.trim();
        const indices = text.split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n) && n >= 0 && n < availableResources.length);

        if (indices.length === 0) {
            return availableResources.sort((a, b) => b.score - a.score).slice(0, 6).map(r => r._id.toString());
        }

        return indices.slice(0, 6).map(i => availableResources[i]._id.toString());
    } catch (error) {
        console.error('Groq Recommendation Error:', error.message);
        return availableResources.sort((a, b) => b.score - a.score).slice(0, 6).map(r => r._id.toString());
    }
};

/**
 * Perform semantic search enhancement using Groq
 * @param {string} query - User's search query
 * @param {Array} resources - Available resources to search through
 * @returns {Array} Ranked resource IDs
 */
const semanticSearch = async (query, resources) => {
    if (!groq || resources.length === 0) {
        return resources.map(r => r._id.toString());
    }

    try {
        const resourceList = resources.slice(0, 30).map((r, i) => 
            `${i}: "${r.title}" - Subject: ${r.subject}, Topic: ${r.topic || 'General'}, Description: ${r.description.substring(0, 100)}`
        ).join('\n');

        const prompt = `You are a semantic search engine for academic resources. A student searched for: "${query}"

Available resources:
${resourceList}

Rank the resources by relevance to the search query. Consider semantic meaning, not just keyword matching. Return ONLY a comma-separated list of resource index numbers in order of relevance (most relevant first). Include only relevant results. Return ONLY the numbers, nothing else.`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            temperature: 0.1,
        });

        const text = completion.choices[0].message.content.trim();
        const indices = text.split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n) && n >= 0 && n < resources.length);

        if (indices.length === 0) {
            return resources.map(r => r._id.toString());
        }

        return indices.map(i => resources[i]._id.toString());
    } catch (error) {
        console.error('Groq Search Error:', error.message);
        return resources.map(r => r._id.toString());
    }
};

module.exports = {
    initAI,
    generateSummary,
    getRecommendations,
    semanticSearch
};
