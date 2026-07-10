const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, (req, res) => {
  res.render('dashboard', { user: req.session.user });
});

module.exports = router;
