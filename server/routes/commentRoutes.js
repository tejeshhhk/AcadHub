/**
 * Comment Routes
 * POST   /api/comments              - Add a comment
 * GET    /api/comments/:resourceId  - Get comments for a resource
 * POST   /api/comments/:id/reply    - Reply to a comment
 * DELETE /api/comments/:id          - Delete a comment
 */
const express = require('express');
const router = express.Router();
const { addComment, getComments, addReply, deleteComment } = require('../controllers/commentController');
const auth = require('../middleware/auth');

// Public route
router.get('/:resourceId', getComments);

// Protected routes
router.post('/', auth, addComment);
router.post('/:id/reply', auth, addReply);
router.delete('/:id', auth, deleteComment);

module.exports = router;
