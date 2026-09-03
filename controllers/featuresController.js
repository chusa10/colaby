const { all, get, run } = require('../config/db');

const STATUSES = ['New', 'Active', 'Resolved', 'Closed', 'Removed', 'Inactive'];

// Feature completion contribution: Closed/Resolved = 100, Active = 50, else 0
function featurePct(status) {
  if (status === 'Closed' || status === 'Resolved') return 100;
  if (status === 'Active') return 50;
  return 0;
}

// GET /projects/:projectId/epics/:epicId/features/new
exports.newForm = (req, res) => {
  const project = get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
  const epic = get('SELECT * FROM epics WHERE id = ?', [req.params.epicId]);
  if (!project || !epic) return res.status(404).send('Not found.');
  res.render('features/form', { project, epic, feature: null, error: null });
};

// POST /projects/:projectId/epics/:epicId/features
exports.create = (req, res) => {
  const { name, status, ado_url, this_week, next_week } = req.body;
  const { projectId, epicId } = req.params;

  if (!name) {
    const project = get('SELECT * FROM projects WHERE id = ?', [projectId]);
    const epic = get('SELECT * FROM epics WHERE id = ?', [epicId]);
    return res.render('features/form', { project, epic, feature: null, error: 'Feature name is required.' });
  }

  run(
    `INSERT INTO features (project_id, epic_id, name, status, ado_url, this_week, next_week)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      projectId, epicId, name.trim(),
      STATUSES.includes(status) ? status : 'New',
      (ado_url || '').trim(),
      (this_week || '').trim(),
      (next_week || '').trim(),
    ]
  );
  res.redirect(`/projects/${projectId}/epics/${epicId}`);
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
  const { name, status, ado_url, this_week, next_week } = req.body;
  const { projectId, epicId, id } = req.params;

  if (!name) {
    const feature = get('SELECT * FROM features WHERE id = ?', [id]);
    const project = get('SELECT * FROM projects WHERE id = ?', [projectId]);
    const epic = get('SELECT * FROM epics WHERE id = ?', [epicId]);
    return res.render('features/form', { project, epic, feature, error: 'Feature name is required.' });
  }
  run(
    `UPDATE features SET name=?, status=?, ado_url=?, this_week=?, next_week=? WHERE id=?`,
    [
      name.trim(),
      STATUSES.includes(status) ? status : 'New',
      (ado_url || '').trim(),
      (this_week || '').trim(),
      (next_week || '').trim(),
      id,
    ]
  );
  res.redirect(`/projects/${projectId}/epics/${epicId}`);
};

// POST /projects/:projectId/epics/:epicId/features/:id/status  (quick status change)
exports.updateStatus = (req, res) => {
  const { status } = req.body;
  const { projectId, epicId, id } = req.params;
  if (STATUSES.includes(status)) {
    run('UPDATE features SET status = ? WHERE id = ?', [status, id]);
  }
  res.redirect(`/projects/${projectId}/epics/${epicId}`);
};

// POST /projects/:projectId/epics/:epicId/features/:id/delete
exports.delete = (req, res) => {
  const { projectId, epicId, id } = req.params;
  run('DELETE FROM user_stories WHERE feature_id = ?', [id]);
  run('DELETE FROM features WHERE id = ?', [id]);
  res.redirect(`/projects/${projectId}/epics/${epicId}`);
};

module.exports.STATUSES = STATUSES;
module.exports.featurePct = featurePct;
