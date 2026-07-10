const bcrypt = require('bcryptjs');
const { all, get, run } = require('../config/db');

// GET /users — list all team members
exports.index = (req, res) => {
  const users = all('SELECT id, name, email, role, created_at FROM users ORDER BY created_at ASC');
  res.render('users/index', { users, currentUser: req.session.user, error: null, query: req.query });
};

// GET /users/invite — show invite form
exports.inviteForm = (req, res) => {
  res.render('users/invite', { currentUser: req.session.user, error: null });
};

// POST /users/invite — create a new team member
exports.invite = (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.render('users/invite', {
      currentUser: req.session.user,
      error: 'All fields are required.'
    });
  }

  const allowed = ['owner', 'supervisor', 'analyst', 'product_mgr'];
  if (!allowed.includes(role)) {
    return res.render('users/invite', {
      currentUser: req.session.user,
      error: 'Invalid role selected.'
    });
  }

  const existing = get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (existing) {
    return res.render('users/invite', {
      currentUser: req.session.user,
      error: 'A user with that email already exists.'
    });
  }

  const hash = bcrypt.hashSync(password, 12);
  run(
    `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
    [name.trim(), email.trim().toLowerCase(), hash, role]
  );

  res.redirect('/users?invited=1');
};

// POST /users/:id/delete — remove a team member (owner cannot delete themselves)
exports.delete = (req, res) => {
  const targetId = parseInt(req.params.id, 10);

  if (targetId === req.session.userId) {
    const users = all('SELECT id, name, email, role, created_at FROM users ORDER BY created_at ASC');
    return res.render('users/index', {
      users,
      currentUser: req.session.user,
      error: 'You cannot remove your own account.',
      query: {}
    });
  }

  run('DELETE FROM users WHERE id = ?', [targetId]);
  res.redirect('/users?deleted=1');
};
