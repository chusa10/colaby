const { all, get, run } = require('../config/db');

// GET /projects/:projectId/epics/:epicId/features/new
exports.newForm = (req, res) => {
  const project = get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
  const epic = get('SELECT * FROM epics WHERE id = ?', [req.params.epicId]);
  if (!project || !epic) return res.status(404).send('Not found.');
  res.render('features/form', { project, epic, feature: null, error: null });
};

// POST /projects/:projectId/epics/:epicId/features
exports.create = (req, res) => {
  const { name, start_date, end_date } = req.body;
  const { projectId, epicId } = req.params;

  if (!name) {
    const project = get('SELECT * FROM projects WHERE id = ?', [projectId]);
    const epic = get('SELECT * FROM epics WHERE id = ?', [epicId]);
    return res.render('features/form', { project, epic, feature: null, error: 'Feature name is required.' });
  }

  run(
    `INSERT INTO features (project_id, epic_id, name, start_date, end_date) VALUES (?, ?, ?, ?, ?)`,
    [projectId, epicId, name.trim(), start_date || null, end_date || null]
  );
  res.redirect(`/projects/${projectId}/epics/${epicId}`);
};

// GET /projects/:projectId/epics/:epicId/features/:id — show stories
exports.view = (req, res) => {
  const feature = get('SELECT * FROM features WHERE id = ?', [req.params.id]);
  if (!feature) return res.status(404).send('Feature not found.');

  const project = get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
  const epic = get('SELECT * FROM epics WHERE id = ?', [req.params.epicId]);
  const stories = all(
    `SELECT * FROM user_stories WHERE feature_id = ? ORDER BY created_at ASC`,
    [feature.id]
  );

  // Calculate progress
  let progress = 0;
  if (stories.length > 0) {
    const done = stories.filter(s => s.status === 'Resolved' || s.status === 'Closed').length;
    progress = Math.round((done / stories.length) * 100);
  }
  feature.progress = progress;

  res.render('features/view', { project, epic, feature, stories });
};

// GET /projects/:projectId/epics/:epicId/features/:id/edit
exports.editForm = (req, res) => {
  const feature = get('SELECT * FROM features WHERE id = ?', [req.params.id]);
  if (!feature) return res.status(404).send('Feature not found.');
  const project = get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
  const epic = get('SELECT * FROM epics WHERE id = ?', [req.params.epicId]);
  res.render('features/form', { project, epic, feature, error: null });
};

// POST /projects/:projectId/epics/:epicId/features/:id
exports.update = (req, res) => {
  const { name, start_date, end_date } = req.body;
  const { projectId, epicId, id } = req.params;

  if (!name) {
    const feature = get('SELECT * FROM features WHERE id = ?', [id]);
    const project = get('SELECT * FROM projects WHERE id = ?', [projectId]);
    const epic = get('SELECT * FROM epics WHERE id = ?', [epicId]);
    return res.render('features/form', { project, epic, feature, error: 'Feature name is required.' });
  }
  run(
    `UPDATE features SET name=?, start_date=?, end_date=? WHERE id=?`,
    [name.trim(), start_date || null, end_date || null, id]
  );
  res.redirect(`/projects/${projectId}/epics/${epicId}`);
};

// POST /projects/:projectId/epics/:epicId/features/:id/delete
exports.delete = (req, res) => {
  const { projectId, epicId, id } = req.params;
  run('DELETE FROM user_stories WHERE feature_id = ?', [id]);
  run('DELETE FROM features WHERE id = ?', [id]);
  res.redirect(`/projects/${projectId}/epics/${epicId}`);
};
