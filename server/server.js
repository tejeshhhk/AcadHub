/**
 * Server Entry Point
 * Initializes Express app, connects to MongoDB, mounts all routes
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// Load environment variables from server/.env
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initAI } = require('./services/aiService');

// Import routes
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const aiRoutes = require('./routes/aiRoutes');
const commentRoutes = require('./routes/commentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for simplicity in development
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (apply to API routes)
app.use('/api', apiLimiter);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// File download endpoint — forces browser to download instead of previewing
app.get('/api/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, '../public/uploads', req.params.filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File not found.' });
    }
    res.download(filePath);
});

// Serve frontend pages for any non-API route (SPA-like behavior)
app.get('*', (req, res) => {
    // If the request looks like a file request (has an extension), return 404 instead of index.html
    // This prevents the "unstyled page" issue where missing CSS files return HTML.
    if (req.path.match(/\.[a-zA-Z0-9]+$/)) {
        return res.status(404).send('Not found');
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    
    // Handle multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File size exceeds the 50MB limit.'
        });
    }
    
    if (err.message && err.message.includes('File type')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    res.status(500).json({
        success: false,
        message: 'Internal server error.'
    });
});

// Start server
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and Init AI
connectDB().catch(console.dir);
initAI();

// Export the app for Vercel Serverless Functions
module.exports = app;

// Only listen on a port if not running in Vercel (Render requires app.listen in production)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`\n🚀 Server running on port ${PORT}`);
        console.log(`📁 Static files: ${path.join(__dirname, '../public')}`);
        console.log(`📤 Uploads: ${uploadsDir}\n`);
    });
}
