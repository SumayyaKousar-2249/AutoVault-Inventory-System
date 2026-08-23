'use strict';

/**
 * One-time script: seed the demo ADMIN account into the production SQLite DB.
 * Run from backend/: node scripts/seedAdmin.js
 */

const bcrypt  = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const DB_PATH = path.resolve(__dirname, '../database.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) { console.error('Cannot open DB:', err.message); process.exit(1); }
});

(async () => {
  const hash = await bcrypt.hash('Admin@123', 10);

  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');

    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        name      TEXT    NOT NULL,
        email     TEXT    NOT NULL UNIQUE,
        password  TEXT    NOT NULL,
        role      TEXT    NOT NULL DEFAULT 'USER',
        createdAt TEXT    NOT NULL DEFAULT (datetime('now'))
      )`
    );

    db.run(
      `INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      ['Admin User', 'admin@autovault.com', hash, 'ADMIN'],
      function (err) {
        if (err) {
          console.error('Seed error:', err.message);
        } else if (this.changes === 0) {
          console.log('Admin account already exists — skipped.');
        } else {
          console.log('Admin seeded successfully: admin@autovault.com');
        }
        db.close();
      }
    );
  });
})();
