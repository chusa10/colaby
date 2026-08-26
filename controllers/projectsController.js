const { all, get, run } = require('../config/db');

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

// GET /projects/:id — Gantt chart view showing Epics
exports.view = (req, res) => {
  const project = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!project) return res.status(404).send('Project not found.');

  const epics = all(
    `SELECT * FROM epics WHERE project_id = ? ORDER BY start_date ASC, created_at ASC`,
    [project.id]
  );

  // Calculate progress per epic from its features' stories
  epics.forEach(e => {
    const features = all('SELECT id FROM features WHERE epic_id = ?', [e.id]);
    let totalStories = 0, doneStories = 0;
    features.forEach(f => {
      const stories = all('SELECT status FROM user_stories WHERE feature_id = ?', [f.id]);
      totalStories += stories.length;
      doneStories += stories.filter(s => s.status === 'Resolved' || s.status === 'Closed').length;
    });
    e.progress = totalStories > 0 ? Math.round((doneStories / totalStories) * 100) : 0;
    e.feature_count = features.length;
  });

  res.render('projects/view', { project, epics });
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
  // Delete all stories under all features under all epics of this project
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
