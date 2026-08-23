'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use an in-memory DB during tests, file-based DB in production
const DB_PATH =
  process.env.NODE_ENV === 'test'
    ? ':memory:'
    : path.resolve(__dirname, '../../database.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite:', err.message);
  }
});

/** Promisify a single db.run call. */
function run(sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => (err ? reject(err) : resolve()));
  });
}

/**
 * Initialize schema — resolves once all tables exist.
 * Must be awaited before any queries are run.
 */
async function initialize() {
  await run('PRAGMA foreign_keys = ON');

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT    NOT NULL,
      email     TEXT    NOT NULL UNIQUE,
      password  TEXT    NOT NULL,
      role      TEXT    NOT NULL DEFAULT 'USER',
      createdAt TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      make      TEXT    NOT NULL,
      model     TEXT    NOT NULL,
      category  TEXT    NOT NULL,
      price     REAL    NOT NULL,
      quantity  INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

module.exports = { db, initialize };
