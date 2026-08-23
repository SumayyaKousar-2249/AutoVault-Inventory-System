'use strict';

const { db } = require('../config/database');

/**
 * Find a user by their email address.
 * @param {string} email
 * @returns {Promise<object|undefined>}
 */
function findByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * Insert a new user record.
 * @param {{ name: string, email: string, password: string, role?: string }} user
 * @returns {Promise<{ id: number, name: string, email: string, role: string }>}
 */
function create({ name, email, password, role = 'USER' }) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `;
    db.run(sql, [name, email, password, role], function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, name, email, role });
    });
  });
}

module.exports = { findByEmail, create };
