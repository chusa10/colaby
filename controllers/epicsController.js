const { all, get, run } = require('../config/db');

// GET /projects/:projectId/epics/new
exports.newForm = (req, res) => {
  const project = get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
  if (!project) return res.status(404).send('Project not found.');
  res.render('epics/form', { project, epic: null, error: null });
};

// POST /projects/:projectId/epics
exports.create = (req, res) => {
  const { name, start_date, end_date } = req.body;
  const projectId = req.params.projectId;

  if (!name || !start_date || !end_date) {
    const project = get('SELECT * FROM projects WHERE id = ?', [projectId]);
    return res.render('epics/form', { project, epic: null, error: 'Name, start and end dates are required.' });
  }

  run(
    `INSERT INTO epics (project_id, name, start_date, end_date) VALUES (?, ?, ?, ?)`,
    [projectId, name.trim(), start_date, end_date]
  );
  res.redirect(`/projects/${projectId}`);
};

// GET /projects/:projectId/epics/:id — show features under this epic
exports.view = (req, res) => {
  const epic = get('SELECT * FROM epics WHERE id = ?', [req.params.id]);
  if (!epic) return res.status(404).send('Epic not found.');

  const project = get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);

  const features = all(
    `SELECT * FROM features WHERE epic_id = ? ORDER BY start_date ASC, created_at ASC`,
    [epic.id]
  );

  // Calculate progress per feature from user stories
  features.forEach(f => {
    f.stories = all(
      `SELECT * FROM user_stories WHERE feature_id = ? ORDER BY created_at ASC`,
      [f.id]
    );
    if (f.stories.length > 0) {
      const done = f.stories.filter(s => s.status === 'Complete' || s.status === 'Closed').length;
      f.progress = Math.round((done / f.stories.length) * 100);
    }
  });

  // Calculate overall epic progress from features
  let epicProgress = 0;
  if (features.length > 0) {
    epicProgress = Math.round(features.reduce((sum, f) => sum + f.progress, 0) / features.length);
  }

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
  const { name, start_date, end_date } = req.body;
  if (!name || !start_date || !end_date) {
    const epic = get('SELECT * FROM epics WHERE id = ?', [req.params.id]);
    const project = get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
    return res.render('epics/form', { project, epic, error: 'Name, start and end dates are required.' });
  }
  run(
    `UPDATE epics SET name=?, start_date=?, end_date=? WHERE id=?`,
    [name.trim(), start_date, end_date, req.params.id]
  );
  res.redirect(`/projects/${req.params.projectId}`);
};

// POST /projects/:projectId/epics/:id/delete
exports.delete = (req, res) => {
  // Delete all user stories under all features of this epic
  const features = all('SELECT id FROM features WHERE epic_id = ?', [req.params.id]);
  features.forEach(f => run('DELETE FROM user_stories WHERE feature_id = ?', [f.id]));
  run('DELETE FROM features WHERE epic_id = ?', [req.params.id]);
  run('DELETE FROM epics WHERE id = ?', [req.params.id]);
  res.redirect(`/projects/${req.params.projectId}`);
};
