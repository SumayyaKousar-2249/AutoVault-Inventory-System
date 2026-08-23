'use strict';

/**
 * Shared test authentication helpers.
 *
 * Centralises the getAdminToken / getUserToken patterns
 * that are used across multiple vehicle test suites, so the implementation
 * lives in one place and each test file simply imports what it needs.
 */

const request = require('supertest');
const bcrypt  = require('bcryptjs');

/**
 * Register a USER account via the API and return their Bearer token.
 * Each call uses the provided email so tests can create isolated accounts.
 *
 * @param {import('express').Application} app
 * @param {string} email
 * @param {string} [password='pass1234']
 * @param {string} [name='Test User']
 */
async function getUserToken(app, email, password = 'pass1234', name = 'Test User') {
  await request(app)
    .post('/api/auth/register')
    .send({ name, email, password });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return res.body.token;
}

/**
 * Insert an ADMIN user directly into the DB (bypassing registration, which
 * always creates USER role) and return their Bearer token.
 *
 * @param {import('express').Application} app
 * @param {import('sqlite3').Database}    db
 */
async function getAdminToken(app, db) {
  const hashedPassword = await bcrypt.hash('adminpass', 10);
  await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      ['Admin User', 'admin@example.com', hashedPassword, 'ADMIN'],
      (err) => (err ? reject(err) : resolve())
    );
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'adminpass' });

  return res.body.token;
}

module.exports = { getUserToken, getAdminToken };
