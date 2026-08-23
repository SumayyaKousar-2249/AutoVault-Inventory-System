'use strict';

/**
 * Middleware: require the authenticated user to have ADMIN role.
 * Must be used AFTER the authenticate middleware (which sets req.user).
 * Returns 403 if the user's role is not ADMIN.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = { requireAdmin };
