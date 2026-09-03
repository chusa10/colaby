const { all, get, run } = require('../config/db');
const { featurePct } = require('./featuresController');

// GET /projects
exports.index = (req, res) => {
  const projects = all(
    `SELECT p.*, (SELECT COUNT(*) FROM epics WHERE project_id = p.id) AS epic_count
     FROM projects p
     ORDER BY p.created_at DESC`
  );
  res.render('projects/index', { projects });
};

// GET /projects/new
exports.newForm = (req, res) => {
  res.render('projects/form', { project: null, error: null });
};

// POST /projects
exports.create = (req, res) => {
  const { title, description, status } = req.body;
  if (!title) {
    return res.render('projects/form', { project: null, error: 'Title is required.' });
  }
  const { lastInsertRowid } = run(
    `INSERT INTO projects (title, description, status) VALUES (?, ?, ?)`,
    [title.trim(), (description || '').trim(), status || 'Not Started']
  );
  res.redirect(`/projects/${lastInsertRowid}`);
};

// Derive epic status from % and dates
function epicStatus(epic, pct) {
  if (pct >= 100) return 'Done';
  const today = new Date().toISOString().slice(0, 10);
  if (epic.end_date && epic.end_date < today && pct < 100) return 'At Risk';
  // Past the halfway point but under 50% → At Risk
  if (epic.start_date && epic.end_date) {
    const start = new Date(epic.start_date).getTime();
    const end   = new Date(epic.end_date).getTime();
    const now   = Date.now();
    if (now > start && end > start) {
      const timeElapsed = (now - start) / (end - start);
      if (timeElapsed > 0.5 && pct < timeElapsed * 100 - 15) return 'At Risk';
    }
  }
  if (pct > 0) return 'On Track';
  return 'Not Started';
}

// GET /projects/:id — dashboard + epic timeline
exports.view = (req, res) => {
  const project = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!project) return res.status(404).send('Project not found.');

  const epics = all(
    `SELECT * FROM epics WHERE project_id = ? ORDER BY start_date ASC, created_at ASC`,
    [project.id]
  );

  // Feature status tally for the dashboard
  const statusTally = {};
  let totalFeatures = 0;

  epics.forEach(e => {
    const features = all('SELECT status FROM features WHERE epic_id = ?', [e.id]);
    e.feature_count = features.length;
    e.progress = features.length > 0
      ? Math.round(features.reduce((sum, f) => sum + featurePct(f.status), 0) / features.length)
      : 0;
    e.statusLabel = epicStatus(e, e.progress);

    features.forEach(f => {
      statusTally[f.status] = (statusTally[f.status] || 0) + 1;
      totalFeatures++;
    });
  });

  // Dashboard summary
  const summary = {
    epicCount: epics.length,
    avgProgress: epics.length > 0
      ? Math.round(epics.reduce((s, e) => s + e.progress, 0) / epics.length)
      : 0,
    atRisk: epics.filter(e => e.statusLabel === 'At Risk').length,
    done: epics.filter(e => e.statusLabel === 'Done').length,
    totalFeatures,
    statusTally,
  };

  res.render('projects/view', { project, epics, summary });
};

// GET /projects/:id/edit
exports.editForm = (req, res) => {
  const project = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!project) return res.status(404).send('Project not found.');
  res.render('projects/form', { project, error: null });
};

// POST /projects/:id
exports.update = (req, res) => {
  const { title, description, status } = req.body;
  if (!title) {
    const project = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    return res.render('projects/form', { project, error: 'Title is required.' });
  }
  run(
    `UPDATE projects SET title=?, description=?, status=? WHERE id=?`,
    [title.trim(), (description || '').trim(), status || 'Not Started', req.params.id]
  );
  res.redirect(`/projects/${req.params.id}`);
};

// POST /projects/:id/delete
exports.delete = (req, res) => {
  const epics = all('SELECT id FROM epics WHERE project_id = ?', [req.params.id]);
  epics.forEach(e => {
    const features = all('SELECT id FROM features WHERE epic_id = ?', [e.id]);
    features.forEach(f => run('DELETE FROM user_stories WHERE feature_id = ?', [f.id]));
    run('DELETE FROM features WHERE epic_id = ?', [e.id]);
  });
  run('DELETE FROM epics WHERE project_id = ?', [req.params.id]);
  run('DELETE FROM projects WHERE id = ?', [req.params.id]);
  res.redirect('/projects');
};
