// Redirect to login if not authenticated
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  res.redirect('/login');
}

// 403 if authenticated user is not the owner
function requireOwner(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'owner') return next();
  res.status(403).send('Access denied — owners only.');
}

module.exports = { requireAuth, requireOwner };
