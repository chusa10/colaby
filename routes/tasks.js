const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const tasksController  = require('../controllers/tasksController');

router.get('/',                requireAuth, tasksController.index);
router.get('/new',             requireAuth, tasksController.newForm);
router.post('/',               requireAuth, tasksController.create);
router.get('/:id',             requireAuth, tasksController.view);
router.get('/:id/edit',        requireAuth, tasksController.editForm);
router.post('/:id/toggle',     requireAuth, tasksController.toggle);
router.post('/:id',            requireAuth, tasksController.update);
router.post('/:id/delete',     requireAuth, tasksController.delete);

module.exports = router;
