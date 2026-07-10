const { all, get, run } = require('../config/db');

// GET /tasks
exports.index = (req, res) => {
  const PAGE_SIZE = 14;
  const page   = Math.max(1, parseInt(req.query.page) || 1);
  const filter = req.query.filter || 'open'; // 'open' | 'completed' | 'all'
  const offset = (page - 1) * PAGE_SIZE;

  const whereClause =
    filter === 'completed' ? 'WHERE t.completed = 1' :
    filter === 'all'       ? '' :
                             'WHERE t.completed = 0';

  const total = get(`SELECT COUNT(*) AS count FROM tasks t ${whereClause}`).count;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const tasks = all(
    `SELECT t.id, t.title, t.description, t.status, t.deadline,
            t.completed, t.completed_at,
            ab.name AS assigned_by_name,
            at2.name AS assigned_to_name
     FROM tasks t
     LEFT JOIN users ab  ON ab.id  = t.assigned_by
     LEFT JOIN users at2 ON at2.id = t.assigned_to
     ${whereClause}
     ORDER BY t.completed ASC, t.deadline ASC, t.created_at DESC
     LIMIT ? OFFSET ?`,
    [PAGE_SIZE, offset]
  );

  res.render('tasks/index', { tasks, page, totalPages, total, filter });
};

// GET /tasks/new
exports.newForm = (req, res) => {
  const users = all('SELECT id, name FROM users ORDER BY name ASC');
  res.render('tasks/form', { task: null, users, error: null });
};

// POST /tasks
exports.create = (req, res) => {
  const { title, description, status, deadline, assigned_to } = req.body;

  if (!title) {
    const users = all('SELECT id, name FROM users ORDER BY name ASC');
    return res.render('tasks/form', { task: null, users, error: 'Title is required.' });
  }

  const { lastInsertRowid } = run(
    `INSERT INTO tasks (title, description, status, deadline, assigned_to, assigned_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      title.trim(),
      (description || '').trim(),
      status || 'Not Started',
      deadline || null,
      assigned_to || null,
      req.session.userId,
    ]
  );

  res.redirect(`/tasks/${lastInsertRowid}`);
};

// GET /tasks/:id
exports.view = (req, res) => {
  const task = get(
    `SELECT t.*,
            ab.name  AS assigned_by_name,
            at2.name AS assigned_to_name
     FROM tasks t
     LEFT JOIN users ab  ON ab.id  = t.assigned_by
     LEFT JOIN users at2 ON at2.id = t.assigned_to
     WHERE t.id = ?`,
    [req.params.id]
  );
  if (!task) return res.status(404).send('Task not found.');
  res.render('tasks/view', { task });
};

// GET /tasks/:id/edit
exports.editForm = (req, res) => {
  const task  = get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  if (!task) return res.status(404).send('Task not found.');
  const users = all('SELECT id, name FROM users ORDER BY name ASC');
  res.render('tasks/form', { task, users, error: null });
};

// POST /tasks/:id
exports.update = (req, res) => {
  const { title, description, status, deadline, assigned_to } = req.body;

  if (!title) {
    const task  = get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    const users = all('SELECT id, name FROM users ORDER BY name ASC');
    return res.render('tasks/form', { task, users, error: 'Title is required.' });
  }

  run(
    `UPDATE tasks SET title=?, description=?, status=?, deadline=?, assigned_to=? WHERE id=?`,
    [
      title.trim(),
      (description || '').trim(),
      status || 'Not Started',
      deadline || null,
      assigned_to || null,
      req.params.id,
    ]
  );

  res.redirect(`/tasks/${req.params.id}`);
};

// POST /tasks/:id/toggle  — mark complete / reopen
exports.toggle = (req, res) => {
  const task = get('SELECT id, completed FROM tasks WHERE id = ?', [req.params.id]);
  if (!task) return res.status(404).send('Task not found.');

  const nowCompleted = task.completed ? 0 : 1;
  const completedAt  = nowCompleted ? new Date().toISOString() : null;

  run(
    `UPDATE tasks SET completed=?, completed_at=?, status=? WHERE id=?`,
    [
      nowCompleted,
      completedAt,
      nowCompleted ? 'Completed' : 'In Progress',
      task.id,
    ]
  );

  // Return to wherever the user came from
  const back = req.get('Referer') || '/tasks';
  res.redirect(back);
};

// POST /tasks/:id/delete
exports.delete = (req, res) => {
  run('DELETE FROM tasks WHERE id = ?', [req.params.id]);
  res.redirect('/tasks');
};
