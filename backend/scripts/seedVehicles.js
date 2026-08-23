'use strict';

/**
 * One-time script: seed a small development vehicle inventory.
 * Skips entirely if the vehicles table already has rows.
 * Run from backend/: node scripts/seedVehicles.js
 */

const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const DB_PATH = path.resolve(__dirname, '../database.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) { console.error('Cannot open DB:', err.message); process.exit(1); }
});

const VEHICLES = [
  { make: 'Toyota',    model: 'Camry',    category: 'Sedan',  price: 26500, quantity: 8  },
  { make: 'Honda',     model: 'Civic',    category: 'Sedan',  price: 22400, quantity: 6  },
  { make: 'Ford',      model: 'F-150',    category: 'Truck',  price: 41200, quantity: 4  },
  { make: 'Toyota',    model: 'RAV4',     category: 'SUV',    price: 31000, quantity: 5  },
  { make: 'BMW',       model: 'X5',       category: 'SUV',    price: 67500, quantity: 2  },
  { make: 'Ford',      model: 'Mustang',  category: 'Sports', price: 34500, quantity: 3  },
  { make: 'Hyundai',   model: 'Elantra',  category: 'Sedan',  price: 19500, quantity: 7  },
  { make: 'Nissan',    model: 'Altima',   category: 'Sedan',  price: 23000, quantity: 0  },
];

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
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

  db.get('SELECT COUNT(*) as cnt FROM vehicles', (err, row) => {
    if (err) { console.error('Count error:', err.message); db.close(); return; }

    if (row.cnt > 0) {
      console.log(`Vehicles table already has ${row.cnt} row(s) — seed skipped.`);
      db.close();
      return;
    }

    const stmt = db.prepare(
      'INSERT INTO vehicles (make, model, category, price, quantity) VALUES (?, ?, ?, ?, ?)'
    );

    let inserted = 0;
    VEHICLES.forEach((v) => {
      stmt.run([v.make, v.model, v.category, v.price, v.quantity], (err2) => {
        if (err2) console.error(`Insert error (${v.make} ${v.model}):`, err2.message);
        else inserted++;
      });
    });

    stmt.finalize((err3) => {
      if (err3) console.error('Finalize error:', err3.message);
      else console.log(`Seeded ${inserted} vehicles into database.db`);
      db.close();
    });
  });
});
