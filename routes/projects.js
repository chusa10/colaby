const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const projectsCtrl = require('../controllers/projectsController');
const featuresCtrl = require('../controllers/featuresController');
const storiesCtrl  = require('../controllers/storiesController');

// Projects CRUD
router.get('/',                 requireAuth, projectsCtrl.index);
router.get('/new',              requireAuth, projectsCtrl.newForm);
router.post('/',                requireAuth, projectsCtrl.create);
router.get('/:id',              requireAuth, projectsCtrl.view);
router.get('/:id/edit',         requireAuth, projectsCtrl.editForm);
router.post('/:id',             requireAuth, projectsCtrl.update);
router.post('/:id/delete',      requireAuth, projectsCtrl.delete);

// Features (nested under project)
router.get('/:projectId/features/new',          requireAuth, featuresCtrl.newForm);
router.post('/:projectId/features',             requireAuth, featuresCtrl.create);
router.get('/:projectId/features/:id',          requireAuth, featuresCtrl.view);
router.get('/:projectId/features/:id/edit',     requireAuth, featuresCtrl.editForm);
router.post('/:projectId/features/:id',         requireAuth, featuresCtrl.update);
router.post('/:projectId/features/:id/delete',  requireAuth, featuresCtrl.delete);

// User stories (nested under feature)
router.post('/:projectId/features/:featureId/stories',                requireAuth, storiesCtrl.create);
router.post('/:projectId/features/:featureId/stories/:id/edit',       requireAuth, storiesCtrl.update);
router.post('/:projectId/features/:featureId/stories/:id/status',     requireAuth, storiesCtrl.updateStatus);
router.post('/:projectId/features/:featureId/stories/:id/delete',     requireAuth, storiesCtrl.delete);

module.exports = router;
