const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const authController  = require('../controllers/authController');

router.get('/login',             authController.showLogin);
router.post('/login',            authController.login);
router.get('/logout',            authController.logout);
router.get('/profile/password',  requireAuth, authController.showChangePassword);
router.post('/profile/password', requireAuth, authController.changePassword);

module.exports = router;
