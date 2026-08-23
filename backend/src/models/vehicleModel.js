'use strict';

const { db } = require('../config/database');

/**
 * Insert a new vehicle record.
 */
function create({ make, model, category, price, quantity }) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO vehicles (make, model, category, price, quantity)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.run(sql, [make, model, category, price, quantity], function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, make, model, category, price, quantity });
    });
  });
}

/**
 * Return all vehicles.
 */
function findAll() {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, make, model, category, price, quantity FROM vehicles',
      [],
      (err, rows) => (err ? reject(err) : resolve(rows))
    );
  });
}

/**
 * Find a single vehicle by id.
 * @returns {Promise<object|undefined>}
 */
function findById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, make, model, category, price, quantity FROM vehicles WHERE id = ?',
      [id],
      (err, row) => (err ? reject(err) : resolve(row))
    );
  });
}

/**
 * Update a vehicle by id.
 * @returns {Promise<object>} updated vehicle
 */
function update(id, { make, model, category, price, quantity }) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE vehicles
      SET make = ?, model = ?, category = ?, price = ?, quantity = ?
      WHERE id = ?
    `;
    db.run(sql, [make, model, category, price, quantity, id], function (err) {
      if (err) reject(err);
      else resolve({ id, make, model, category, price, quantity });
    });
  });
}

/**
 * Delete a vehicle by id.
 * @returns {Promise<number>} number of rows deleted
 */
function remove(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM vehicles WHERE id = ?', [id], function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

/**
 * Search vehicles with optional filters.
 * All string comparisons are case-insensitive.
 * Accepts query-string values (strings) for minPrice/maxPrice and converts them.
 * @param {{ make?, model?, category?, minPrice?, maxPrice? }} filters
 * @returns {Promise<Array>}
 */
function findByFilters({ make, model, category, minPrice, maxPrice } = {}) {
  const conditions = [];
  const params = [];

  if (make) {
    conditions.push('LOWER(make) = LOWER(?)');
    params.push(make);
  }
  if (model) {
    conditions.push('LOWER(model) = LOWER(?)');
    params.push(model);
  }
  if (category) {
    conditions.push('LOWER(category) = LOWER(?)');
    params.push(category);
  }
  if (minPrice !== undefined && minPrice !== '') {
    conditions.push('price >= ?');
    params.push(Number(minPrice));
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    conditions.push('price <= ?');
    params.push(Number(maxPrice));
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT id, make, model, category, price, quantity FROM vehicles ${where}`;

  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

/**
 * Decrement quantity by 1 atomically.
 * @returns {Promise<number>} 1 if decremented, 0 if vehicle not found or already out of stock
 */
function decrementQuantity(id) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE vehicles
      SET quantity = quantity - 1
      WHERE id = ? AND quantity > 0
    `;
    db.run(sql, [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes); // 1 if updated, 0 if not found or out of stock
    });
  });
}

/**
 * Increment quantity by a given amount atomically.
 * @param {number} id
 * @param {number} amount  positive integer
 * @returns {Promise<number>} 1 if updated, 0 if vehicle not found
 */
function incrementQuantity(id, amount) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE vehicles SET quantity = quantity + ? WHERE id = ?',
      [amount, id],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes); // 1 if row existed, 0 if not found
      }
    );
  });
}

module.exports = { create, findAll, findById, update, remove, findByFilters, decrementQuantity, incrementQuantity };
