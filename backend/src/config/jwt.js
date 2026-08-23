'use strict';

/**
 * Central JWT configuration.
 * JWT_SECRET must be set in the environment for production.
 * The fallback is intentionally weak and only for local development.
 */
const JWT_SECRET = process.env.JWT_SECRET || 'dev_fallback_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

module.exports = { JWT_SECRET, JWT_EXPIRES_IN };
