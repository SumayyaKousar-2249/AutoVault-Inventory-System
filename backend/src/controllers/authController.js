'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const SALT_ROUNDS = 10;

/**
 * Validate registration input fields.
 * @param {{ name: string, email: string, password: string }} fields
 * @returns {string|null} Error message, or null if valid.
 */
function validateRegistrationInput({ name, email, password }) {
  if (!name || !email || !password) {
    return 'name, email, and password are required.';
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'Invalid email format.';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

/**
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const name     = (req.body.name     || '').trim();
    const email    = (req.body.email    || '').trim().toLowerCase();
    const password =  req.body.password || '';

    const validationError = validateRegistrationInput({ name, email, password });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userModel.create({ name, email, password: hashedPassword });

    return res.status(201).json({ user });
  } catch (err) {
    console.error('Registration error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const email    = (req.body.email    || '').trim().toLowerCase();
    const password =  req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { register, validateRegistrationInput, login };
