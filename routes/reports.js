const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const reportsController = require('../controllers/reportsController');

router.get('/', requireAuth, reportsController.index);
router.get('/new', requireAuth, reportsController.newForm);
router.post('/', requireAuth, reportsController.create);
router.get('/:id', requireAuth, reportsController.view);
router.get('/:id/edit', requireAuth, reportsController.editForm);
router.post('/:id', requireAuth, reportsController.update);
router.post('/:id/delete', requireAuth, reportsController.delete);

module.exports = router;
