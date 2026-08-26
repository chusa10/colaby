const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const projectsCtrl = require('../controllers/projectsController');
const epicsCtrl    = require('../controllers/epicsController');
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

// Epics (nested under project)
router.get('/:projectId/epics/new',          requireAuth, epicsCtrl.newForm);
router.post('/:projectId/epics',             requireAuth, epicsCtrl.create);
router.get('/:projectId/epics/:id',          requireAuth, epicsCtrl.view);
router.get('/:projectId/epics/:id/edit',     requireAuth, epicsCtrl.editForm);
router.post('/:projectId/epics/:id',         requireAuth, epicsCtrl.update);
router.post('/:projectId/epics/:id/delete',  requireAuth, epicsCtrl.delete);

// Features (nested under epic)
router.get('/:projectId/epics/:epicId/features/new',          requireAuth, featuresCtrl.newForm);
router.post('/:projectId/epics/:epicId/features',             requireAuth, featuresCtrl.create);
router.get('/:projectId/epics/:epicId/features/:id',          requireAuth, featuresCtrl.view);
router.get('/:projectId/epics/:epicId/features/:id/edit',     requireAuth, featuresCtrl.editForm);
router.post('/:projectId/epics/:epicId/features/:id',         requireAuth, featuresCtrl.update);
router.post('/:projectId/epics/:epicId/features/:id/delete',  requireAuth, featuresCtrl.delete);

// User stories (nested under feature)
router.post('/:projectId/epics/:epicId/features/:featureId/stories',                requireAuth, storiesCtrl.create);
router.post('/:projectId/epics/:epicId/features/:featureId/stories/:id/edit',       requireAuth, storiesCtrl.update);
router.post('/:projectId/epics/:epicId/features/:featureId/stories/:id/status',     requireAuth, storiesCtrl.updateStatus);
router.post('/:projectId/epics/:epicId/features/:featureId/stories/:id/delete',     requireAuth, storiesCtrl.delete);

module.exports = router;
