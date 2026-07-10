const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/colab.db');

let _db = null;

async function getDb() {
  if (_db) return _db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }

  _db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT    NOT NULL,
      email     TEXT    UNIQUE NOT NULL,
      password  TEXT    NOT NULL,
      role      TEXT    NOT NULL DEFAULT 'analyst',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT NOT NULL,
      date       TEXT NOT NULL,
      summary    TEXT,
      minutes    TEXT,
      user_id    INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      week_of    TEXT NOT NULL,
      title      TEXT,
      content    TEXT NOT NULL,
      user_id    INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      description TEXT,
      status      TEXT NOT NULL DEFAULT 'Not Started',
      assigned_to INTEGER,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS projects (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      description TEXT,
      status      TEXT NOT NULL DEFAULT 'Not Started',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add title column to reports if it doesn't exist yet (migration for existing DBs)
  try { _db.run(`ALTER TABLE reports ADD COLUMN title TEXT`); } catch(e) { /* already exists */ }

  // Tasks migrations — add new columns for assignor, deadline, completion
  try { _db.run(`ALTER TABLE tasks ADD COLUMN assigned_by INTEGER REFERENCES users(id)`); } catch(e) {}
  try { _db.run(`ALTER TABLE tasks ADD COLUMN deadline TEXT`); } catch(e) {}
  try { _db.run(`ALTER TABLE tasks ADD COLUMN completed INTEGER NOT NULL DEFAULT 0`); } catch(e) {}
  try { _db.run(`ALTER TABLE tasks ADD COLUMN completed_at DATETIME`); } catch(e) {}

  // Features & user stories tables for projects
  _db.run(`
    CREATE TABLE IF NOT EXISTS features (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id  INTEGER NOT NULL,
      name        TEXT NOT NULL,
      start_date  TEXT,
      end_date    TEXT,
      progress    INTEGER NOT NULL DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_stories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      feature_id  INTEGER NOT NULL,
      title       TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'In Progress',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
    );
  `);

  persist();
  return _db;
}

// ── Query helpers ────────────────────────────────────────────────────────────

/**
 * Execute a mutating statement (INSERT / UPDATE / DELETE).
 * Returns { lastInsertRowid, changes }.
 */
function run(sql, params = []) {
  _db.run(sql, params);
  const meta = _db.exec('SELECT last_insert_rowid() AS id, changes() AS changes');
  persist();
  if (!meta.length) return { lastInsertRowid: null, changes: 0 };
  const row = meta[0].values[0];
  return { lastInsertRowid: row[0], changes: row[1] };
}

/**
 * Return a single row as a plain object, or null if not found.
 */
function get(sql, params = []) {
  const result = _db.exec(sql, params);
  if (!result.length || !result[0].values.length) return null;
  const { columns, values } = result[0];
  return Object.fromEntries(columns.map((col, i) => [col, values[0][i]]));
}

/**
 * Return all matching rows as an array of plain objects.
 */
function all(sql, params = []) {
  const result = _db.exec(sql, params);
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map(row => Object.fromEntries(columns.map((col, i) => [col, row[i]])));
}

// ── Persist to disk ──────────────────────────────────────────────────────────

function persist() {
  if (!_db) return;
  const data = _db.export();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

module.exports = { getDb, run, get, all, persist };
