const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

const isPostgres = !!process.env.DATABASE_URL;
let db;

function translateSql(sql) {
  let index = 1;
  let translated = sql.replace(/\?/g, () => `$${index++}`);
  if (translated.trim().toUpperCase().startsWith('INSERT INTO')) {
    if (!translated.toUpperCase().includes('RETURNING')) {
      translated += ' RETURNING id';
    }
  }
  return translated;
}

if (isPostgres) {
  console.log('Using PostgreSQL database config...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase/Render SSL connections
  });

  db = {
    run: (sql, params, callback) => {
      const translatedSql = translateSql(sql);
      const values = params || [];
      pool.query(translatedSql, values, (err, res) => {
        if (err) {
          if (callback) callback(err);
        } else {
          // Emulate sqlite's lastID injection via this.lastID context
          const lastID = res.rows[0] ? res.rows[0].id : null;
          if (callback) {
            callback.call({ lastID }, null);
          }
        }
      });
    },
    all: (sql, params, callback) => {
      const translatedSql = translateSql(sql);
      const values = params || [];
      pool.query(translatedSql, values, (err, res) => {
        if (err) {
          if (callback) callback(err);
        } else {
          if (callback) callback(null, res.rows);
        }
      });
    },
    get: (sql, params, callback) => {
      const translatedSql = translateSql(sql);
      const values = params || [];
      pool.query(translatedSql, values, (err, res) => {
        if (err) {
          if (callback) callback(err);
        } else {
          if (callback) callback(null, res.rows[0]);
        }
      });
    },
    serialize: (fn) => {
      // Direct sequential run emulation
      fn();
    }
  };

  // Run Postgres migrations
  pool.query(`
    CREATE TABLE IF NOT EXISTS sports_event_sponsorship_kit_donation (
      id SERIAL PRIMARY KEY,
      event_name TEXT NOT NULL,
      event_date TEXT NOT NULL,
      category TEXT NOT NULL,
      budget_limit REAL NOT NULL DEFAULT 0.0,
      items_donated TEXT NOT NULL,
      brand_visibility_received TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Approved',
      notes TEXT,
      total_cost REAL NOT NULL DEFAULT 0.0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error("Postgres migration error (sports table):", err.message);
    else {
      pool.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          sponsorship_id INTEGER NOT NULL,
          items_donated TEXT,
          brand_visibility_received TEXT,
          status TEXT NOT NULL,
          changed_by TEXT NOT NULL DEFAULT 'Staff/System',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err2) => {
        if (err2) console.error("Postgres migration error (audit logs):", err2.message);
        else console.log("PostgreSQL database tables verified/migrated successfully.");
      });
    }
  });

} else {
  console.log('Using SQLite database config...');
  const dbPath = path.resolve(__dirname, 'oxygen_sports.db');
  const sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Failed to connect to SQLite database:', err.message);
    } else {
      console.log('Connected to SQLite database at:', dbPath);
    }
  });

  db = sqliteDb;

  sqliteDb.serialize(() => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS sports_event_sponsorship_kit_donation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_name TEXT NOT NULL,
        event_date TEXT NOT NULL,
        category TEXT NOT NULL,
        budget_limit REAL NOT NULL DEFAULT 0.0,
        items_donated TEXT NOT NULL,
        brand_visibility_received TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Approved',
        notes TEXT,
        total_cost REAL NOT NULL DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sponsorship_id INTEGER NOT NULL,
        items_donated TEXT,
        brand_visibility_received TEXT,
        status TEXT NOT NULL,
        changed_by TEXT NOT NULL DEFAULT 'Staff/System',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(sponsorship_id) REFERENCES sports_event_sponsorship_kit_donation(id)
      )
    `);
    
    console.log('SQLite database tables verified/migrated successfully.');
  });
}

module.exports = db;
