const express = require('express');
const router  = express.Router();
const { requireAuth, requireOwner } = require('../middleware/authMiddleware');
const usersController = require('../controllers/usersController');

// All user-management routes require login + owner role
router.use(requireAuth, requireOwner);

router.get('/',              usersController.index);
router.get('/invite',        usersController.inviteForm);
router.post('/invite',       usersController.invite);
router.post('/:id/delete',   usersController.delete);

module.exports = router;
