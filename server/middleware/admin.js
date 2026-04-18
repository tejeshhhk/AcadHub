/**
 * Admin Middleware
 * Checks if the authenticated user has admin role
 * Must be used AFTER the auth middleware
 */
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ 
            success: false, 
            message: 'Access denied. Admin privileges required.' 
        });
    }
};

module.exports = admin;
