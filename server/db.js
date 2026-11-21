// Database abstraction: Neon Postgres when DATABASE_URL is set, otherwise SQLite (node:sqlite)
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = process.env.DATABASE_URL;

let pgPool = null;
let sqliteDb = null;
export const isPostgres = !!DATABASE_URL;

function toPgSql(sql) {
  let idx = 1;
  let s = sql.replace(/\?/g, () => '$' + (idx++));
  // Replace SQLite specific INSERT OR IGNORE with Postgres ON CONFLICT DO NOTHING
  s = s.replace(/INSERT OR IGNORE INTO trades\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i, (m, cols, vals) => {
    return `INSERT INTO trades(${cols}) VALUES(${vals}) ON CONFLICT (user_id, client_id) DO NOTHING`;
  });
  return s;
}

if (isPostgres) {
  console.log('Using Neon PostgreSQL database...');
  const { default: pg } = await import('pg');
  // Ensure BIGINTs (id, balance_cents, timestamps) parse as numbers where safe
  pg.types.setTypeParser(20, val => (val === null ? null : Number(val)));
  
  pgPool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // Test connection
  try {
    const client = await pgPool.connect();
    client.release();
    console.log('Neon PostgreSQL connected successfully.');
  } catch (err) {
    console.error('Failed to connect to Neon PostgreSQL:', err.message);
    throw err;
  }
} else {
  console.log('Using local SQLite database...');
  const { DatabaseSync } = await import('node:sqlite');
  let DB_PATH = process.env.DB_PATH || path.join(__dir, '..', 'data', 'vantage.db');
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  } catch {
    DB_PATH = path.join(__dir, '..', 'data', 'vantage.db');
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  sqliteDb = new DatabaseSync(DB_PATH);
  sqliteDb.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
}

export const db = {
  isPostgres,
  
  async exec(sql) {
    if (isPostgres) {
      await pgPool.query(sql);
    } else {
      sqliteDb.exec(sql);
    }
  },

  async get(sql, ...params) {
    if (isPostgres) {
      const res = await pgPool.query(toPgSql(sql), params);
      return res.rows[0] || null;
    } else {
      return sqliteDb.prepare(sql).get(...params) || null;
    }
  },

  async all(sql, ...params) {
    if (isPostgres) {
      const res = await pgPool.query(toPgSql(sql), params);
      return res.rows;
    } else {
      return sqliteDb.prepare(sql).all(...params);
    }
  },

  async run(sql, ...params) {
    if (isPostgres) {
      const res = await pgPool.query(toPgSql(sql), params);
      return { changes: res.rowCount };
    } else {
      return sqliteDb.prepare(sql).run(...params);
    }
  },

  async tx(fn) {
    if (isPostgres) {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        const clientWrapper = {
          get: async (sql, ...params) => (await client.query(toPgSql(sql), params)).rows[0] || null,
          all: async (sql, ...params) => (await client.query(toPgSql(sql), params)).rows,
          run: async (sql, ...params) => ({ changes: (await client.query(toPgSql(sql), params)).rowCount }),
        };
        const result = await fn(clientWrapper);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      sqliteDb.exec('BEGIN IMMEDIATE');
      try {
        const result = await fn({
          get: async (sql, ...params) => sqliteDb.prepare(sql).get(...params) || null,
          all: async (sql, ...params) => sqliteDb.prepare(sql).all(...params),
          run: async (sql, ...params) => sqliteDb.prepare(sql).run(...params),
        });
        sqliteDb.exec('COMMIT');
        return result;
      } catch (err) {
        sqliteDb.exec('ROLLBACK');
        throw err;
      }
    }
  }
};

// Initialize schema
if (isPostgres) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT,
      country TEXT,
      currency TEXT,
      acct_type TEXT,
      account_no TEXT UNIQUE,
      salt TEXT,
      hash TEXT,
      role TEXT DEFAULT 'user',
      balance REAL DEFAULT 0,
      balance_cents BIGINT NOT NULL DEFAULT 0,
      deposit_acct TEXT,
      created_at BIGINT
    );
    CREATE TABLE IF NOT EXISTS tx (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      kind TEXT,
      amount REAL,
      amount_cents BIGINT,
      status TEXT,
      note TEXT,
      detail TEXT,
      decided_by INTEGER,
      ref TEXT,
      process_at BIGINT,
      settle_at BIGINT,
      created_at BIGINT
    );
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      client_id TEXT,
      symbol TEXT,
      direction TEXT,
      lots REAL,
      open_price REAL,
      close_price REAL,
      pnl REAL,
      pips REAL,
      tag TEXT,
      reason TEXT,
      open_time BIGINT,
      close_time BIGINT,
      UNIQUE(user_id, client_id)
    );
    CREATE TABLE IF NOT EXISTS meta (
      k TEXT PRIMARY KEY,
      v TEXT
    );
    CREATE INDEX IF NOT EXISTS tx_user ON tx(user_id, id);
  `);
} else {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE, name TEXT, country TEXT, currency TEXT,
      acct_type TEXT, account_no TEXT, salt TEXT, hash TEXT, role TEXT DEFAULT 'user', balance REAL DEFAULT 0, balance_cents INTEGER NOT NULL DEFAULT 0, deposit_acct TEXT, created_at INTEGER);
    CREATE TABLE IF NOT EXISTS tx(id INTEGER PRIMARY KEY, user_id INTEGER, kind TEXT, amount REAL, amount_cents INTEGER, status TEXT, note TEXT, detail TEXT, decided_by INTEGER, ref TEXT, process_at INTEGER, settle_at INTEGER, created_at INTEGER);
    CREATE TABLE IF NOT EXISTS trades(id INTEGER PRIMARY KEY, user_id INTEGER, client_id TEXT, symbol TEXT, direction TEXT, lots REAL,
      open_price REAL, close_price REAL, pnl REAL, pips REAL, tag TEXT, reason TEXT, open_time INTEGER, close_time INTEGER, UNIQUE(user_id, client_id));
    CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT);
    CREATE INDEX IF NOT EXISTS tx_user ON tx(user_id, id);
  `);
}
