const { all, get, run } = require('../config/db');

// GET /projects
exports.index = (req, res) => {
  const projects = all(
    `SELECT p.*, (SELECT COUNT(*) FROM features WHERE project_id = p.id) AS feature_count
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

// GET /projects/:id — Gantt chart view
exports.view = (req, res) => {
  const project = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!project) return res.status(404).send('Project not found.');

  const features = all(
    `SELECT * FROM features WHERE project_id = ? ORDER BY start_date ASC, created_at ASC`,
    [project.id]
  );

  // Get stories count per feature
  features.forEach(f => {
    f.stories = all(
      `SELECT * FROM user_stories WHERE feature_id = ? ORDER BY created_at ASC`,
      [f.id]
    );
    // Auto-calculate progress from stories
    if (f.stories.length > 0) {
      const done = f.stories.filter(s => s.status === 'Complete' || s.status === 'Closed').length;
      f.progress = Math.round((done / f.stories.length) * 100);
    }
  });

  res.render('projects/view', { project, features });
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
  // Delete all user stories under all features of this project
  const features = all('SELECT id FROM features WHERE project_id = ?', [req.params.id]);
  features.forEach(f => run('DELETE FROM user_stories WHERE feature_id = ?', [f.id]));
  run('DELETE FROM features WHERE project_id = ?', [req.params.id]);
  run('DELETE FROM projects WHERE id = ?', [req.params.id]);
  res.redirect('/projects');
};
