const bcrypt = require('bcryptjs');
const { get, run } = require('../config/db');

exports.showLogin = (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('auth/login', { error: null });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('auth/login', { error: 'Email and password are required.' });
  }

  const user = get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.render('auth/login', { error: 'Invalid email or password.' });
  }

  req.session.userId = user.id;
  req.session.user   = { id: user.id, name: user.name, email: user.email, role: user.role };

  res.redirect('/dashboard');
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
};

// GET /profile/password
exports.showChangePassword = (req, res) => {
  res.render('auth/change-password', { error: null, success: null });
};

// POST /profile/password
exports.changePassword = (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;

  if (!current_password || !new_password || !confirm_password) {
    return res.render('auth/change-password', {
      error: 'All fields are required.',
      success: null
    });
  }

  if (new_password.length < 8) {
    return res.render('auth/change-password', {
      error: 'New password must be at least 8 characters.',
      success: null
    });
  }

  if (new_password !== confirm_password) {
    return res.render('auth/change-password', {
      error: 'New password and confirmation do not match.',
      success: null
    });
  }

  const user = get('SELECT * FROM users WHERE id = ?', [req.session.userId]);

  if (!user || !bcrypt.compareSync(current_password, user.password)) {
    return res.render('auth/change-password', {
      error: 'Current password is incorrect.',
      success: null
    });
  }

  const hash = bcrypt.hashSync(new_password, 12);
  run('UPDATE users SET password = ? WHERE id = ?', [hash, req.session.userId]);

  res.render('auth/change-password', {
    error: null,
    success: 'Password updated successfully.'
  });
};
