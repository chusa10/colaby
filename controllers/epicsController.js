const { all, get, run } = require('../config/db');
const { featurePct } = require('./featuresController');

// GET /projects/:projectId/epics/new
exports.newForm = (req, res) => {
  const project = get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
  if (!project) return res.status(404).send('Project not found.');
  res.render('epics/form', { project, epic: null, error: null });
};

// POST /projects/:projectId/epics
exports.create = (req, res) => {
  const { name, start_date, end_date, ado_url } = req.body;
  const projectId = req.params.projectId;

  if (!name || !start_date || !end_date) {
    const project = get('SELECT * FROM projects WHERE id = ?', [projectId]);
    return res.render('epics/form', { project, epic: null, error: 'Name, start and end dates are required.' });
  }

  run(
    `INSERT INTO epics (project_id, name, start_date, end_date, ado_url) VALUES (?, ?, ?, ?, ?)`,
    [projectId, name.trim(), start_date, end_date, (ado_url || '').trim()]
  );
  res.redirect(`/projects/${projectId}`);
};

// GET /projects/:projectId/epics/:id — show features under this epic
exports.view = (req, res) => {
  const epic = get('SELECT * FROM epics WHERE id = ?', [req.params.id]);
  if (!epic) return res.status(404).send('Epic not found.');

  const project = get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);

  const features = all(
    `SELECT * FROM features WHERE epic_id = ? ORDER BY created_at ASC`,
    [epic.id]
  );

  // Each feature contributes: Closed/Resolved=100, Active=50, else 0
  features.forEach(f => { f.progress = featurePct(f.status); });

  const epicProgress = features.length > 0
    ? Math.round(features.reduce((sum, f) => sum + f.progress, 0) / features.length)
    : 0;

  res.render('epics/view', { project, epic, features, epicProgress });
};

// GET /projects/:projectId/epics/:id/edit
exports.editForm = (req, res) => {
  const epic = get('SELECT * FROM epics WHERE id = ?', [req.params.id]);
  if (!epic) return res.status(404).send('Epic not found.');
  const project = get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
  res.render('epics/form', { project, epic, error: null });
};

// POST /projects/:projectId/epics/:id
exports.update = (req, res) => {
  const { name, start_date, end_date, ado_url } = req.body;
  if (!name || !start_date || !end_date) {
    const epic = get('SELECT * FROM epics WHERE id = ?', [req.params.id]);
    const project = get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
    return res.render('epics/form', { project, epic, error: 'Name, start and end dates are required.' });
  }
  run(
    `UPDATE epics SET name=?, start_date=?, end_date=?, ado_url=? WHERE id=?`,
    [name.trim(), start_date, end_date, (ado_url || '').trim(), req.params.id]
  );
  res.redirect(`/projects/${req.params.projectId}`);
};

// POST /projects/:projectId/epics/:id/delete
exports.delete = (req, res) => {
  const features = all('SELECT id FROM features WHERE epic_id = ?', [req.params.id]);
  features.forEach(f => run('DELETE FROM user_stories WHERE feature_id = ?', [f.id]));
  run('DELETE FROM features WHERE epic_id = ?', [req.params.id]);
  run('DELETE FROM epics WHERE id = ?', [req.params.id]);
  res.redirect(`/projects/${req.params.projectId}`);
};
