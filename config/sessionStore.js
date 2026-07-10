const session = require('express-session');
const { get, run, all, persist } = require('./db');

/**
 * SQLite-backed session store using sql.js.
 * Sessions survive server restarts.
 */
class SqliteSessionStore extends session.Store {
  constructor() {
    super();
  }

  /** Called once after DB is initialized */
  init() {
    // Create sessions table if not exists
    try {
      run(`
        CREATE TABLE IF NOT EXISTS sessions (
          sid TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          expires INTEGER
        )
      `);
    } catch (e) {
      // Table already exists
    }
    // Clean expired sessions on startup
    this._cleanup();
  }

  get(sid, callback) {
    try {
      const row = get('SELECT data, expires FROM sessions WHERE sid = ?', [sid]);
      if (!row) return callback(null, null);
      if (row.expires && row.expires < Date.now()) {
        this.destroy(sid, () => {});
        return callback(null, null);
      }
      const data = JSON.parse(row.data);
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  }

  set(sid, sessionData, callback) {
    try {
      const expires = sessionData.cookie && sessionData.cookie.expires
        ? new Date(sessionData.cookie.expires).getTime()
        : Date.now() + 24 * 60 * 60 * 1000; // default 24h

      const data = JSON.stringify(sessionData);
      const existing = get('SELECT sid FROM sessions WHERE sid = ?', [sid]);

      if (existing) {
        run('UPDATE sessions SET data = ?, expires = ? WHERE sid = ?', [data, expires, sid]);
      } else {
        run('INSERT INTO sessions (sid, data, expires) VALUES (?, ?, ?)', [sid, data, expires]);
      }
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  destroy(sid, callback) {
    try {
      run('DELETE FROM sessions WHERE sid = ?', [sid]);
      if (callback) callback(null);
    } catch (err) {
      if (callback) callback(err);
    }
  }

  _cleanup() {
    try {
      run('DELETE FROM sessions WHERE expires < ?', [Date.now()]);
    } catch (e) {
      // ignore
    }
  }
}

module.exports = SqliteSessionStore;
