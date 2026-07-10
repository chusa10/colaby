/**
 * seed.js — creates initial user accounts.
 * Usage:  node config/seed.js  (or: npm run seed)
 *
 * Safe to re-run — skips any user whose email already exists.
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getDb, run, get } = require('./db');

const USERS = [
  {
    name:     'Jesus Garcia',              // change to your real name
    email:    'jesus@colaby.app',   // change to your real email
    password: 'changeme123',
    role:     'owner',
  },
  {
    name:     'Anna Baik',
    email:    'anna@colaby.app',
    password: 'changeme111',
    role:     'analyst',
  },
  {
    name:     'Mitch Atkinson',
    email:    'mitch@colaby.app',
    password: 'changeme222',
    role:     'product_mgr',
  },
];

(async () => {
  await getDb();

  for (const user of USERS) {
    const existing = get('SELECT id FROM users WHERE email = ?', [user.email]);
    if (existing) {
      console.log(`  SKIP  ${user.email} — already exists`);
      continue;
    }

    const hash = bcrypt.hashSync(user.password, 12);
    const { lastInsertRowid } = run(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      [user.name, user.email, hash, user.role]
    );

    console.log(`  CREATED  ${user.name} <${user.email}> (id=${lastInsertRowid}, role=${user.role})`);
    console.log(`           Temp password: ${user.password}`);
  }

  console.log('\nDone. Remind all users to change their password after first login.');
  process.exit(0);
})();
