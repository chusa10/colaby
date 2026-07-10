const { all, get, run } = require('../config/db');

// GET /projects/:projectId/features/new
exports.newForm = (req, res) => {
  const project = get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
  if (!project) return res.status(404).send('Project not found.');
  res.render('features/form', { project, feature: null, error: null });
};

// POST /projects/:projectId/features
exports.create = (req, res) => {
  const { name, start_date, end_date } = req.body;
  const projectId = req.params.projectId;

  if (!name || !start_date || !end_date) {
    const project = get('SELECT * FROM projects WHERE id = ?', [projectId]);
    return res.render('features/form', { project, feature: null, error: 'Name, start and end dates are required.' });
  }

  run(
    `INSERT INTO features (project_id, name, start_date, end_date) VALUES (?, ?, ?, ?)`,
    [projectId, name.trim(), start_date, end_date]
  );
  res.redirect(`/projects/${projectId}`);
};

// GET /projects/:projectId/features/:id — show stories
exports.view = (req, res) => {
  const feature = get('SELECT * FROM features WHERE id = ?', [req.params.id]);
  if (!feature) return res.status(404).send('Feature not found.');

  const project = get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
  const stories = all(
    `SELECT * FROM user_stories WHERE feature_id = ? ORDER BY created_at ASC`,
    [feature.id]
  );

  res.render('features/view', { project, feature, stories });
};

// GET /projects/:projectId/features/:id/edit
exports.editForm = (req, res) => {
  const feature = get('SELECT * FROM features WHERE id = ?', [req.params.id]);
  if (!feature) return res.status(404).send('Feature not found.');
  const project = get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
  res.render('features/form', { project, feature, error: null });
};

// POST /projects/:projectId/features/:id
exports.update = (req, res) => {
  const { name, start_date, end_date } = req.body;
  if (!name || !start_date || !end_date) {
    const feature = get('SELECT * FROM features WHERE id = ?', [req.params.id]);
    const project = get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
    return res.render('features/form', { project, feature, error: 'Name, start and end dates are required.' });
  }
  run(
    `UPDATE features SET name=?, start_date=?, end_date=? WHERE id=?`,
    [name.trim(), start_date, end_date, req.params.id]
  );
  res.redirect(`/projects/${req.params.projectId}`);
};

// POST /projects/:projectId/features/:id/delete
exports.delete = (req, res) => {
  run('DELETE FROM user_stories WHERE feature_id = ?', [req.params.id]);
  run('DELETE FROM features WHERE id = ?', [req.params.id]);
  res.redirect(`/projects/${req.params.projectId}`);
};
