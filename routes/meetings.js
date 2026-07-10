const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const meetingsController = require('../controllers/meetingsController');

router.get('/', requireAuth, meetingsController.index);
router.get('/new', requireAuth, meetingsController.newForm);
router.post('/', requireAuth, meetingsController.create);
router.get('/:id', requireAuth, meetingsController.view);
router.get('/:id/edit', requireAuth, meetingsController.editForm);
router.post('/:id', requireAuth, meetingsController.update);
router.post('/:id/delete', requireAuth, meetingsController.delete);

module.exports = router;
