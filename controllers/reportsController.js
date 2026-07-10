const { all, get, run } = require('../config/db');

// GET /reports
exports.index = (req, res) => {
  const PAGE_SIZE = 14;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const total = get('SELECT COUNT(*) AS count FROM reports').count;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const reports = all(
    `SELECT r.id, r.week_of, r.title, r.content, r.created_at, u.name AS author
     FROM reports r
     LEFT JOIN users u ON u.id = r.user_id
     ORDER BY r.week_of DESC, r.created_at DESC
     LIMIT ? OFFSET ?`,
    [PAGE_SIZE, offset]
  );

  res.render('reports/index', { reports, page, totalPages, total });
};

// GET /reports/new
exports.newForm = (req, res) => {
  res.render('reports/form', { report: null, error: null });
};

// POST /reports
exports.create = (req, res) => {
  const { week_of, title, content } = req.body;

  if (!week_of || !content) {
    return res.render('reports/form', {
      report: null,
      error: 'Week and report content are required.'
    });
  }

  const { lastInsertRowid } = run(
    `INSERT INTO reports (week_of, title, content, user_id) VALUES (?, ?, ?, ?)`,
    [week_of, (title || '').trim(), content.trim(), req.session.userId]
  );

  res.redirect(`/reports/${lastInsertRowid}`);
};

// GET /reports/:id
exports.view = (req, res) => {
  const report = get(
    `SELECT r.*, u.name AS author
     FROM reports r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.id = ?`,
    [req.params.id]
  );
  if (!report) return res.status(404).send('Report not found.');
  res.render('reports/view', { report });
};

// GET /reports/:id/edit
exports.editForm = (req, res) => {
  const report = get('SELECT * FROM reports WHERE id = ?', [req.params.id]);
  if (!report) return res.status(404).send('Report not found.');
  res.render('reports/form', { report, error: null });
};

// POST /reports/:id
exports.update = (req, res) => {
  const { week_of, title, content } = req.body;

  if (!week_of || !content) {
    const report = get('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    return res.render('reports/form', { report, error: 'Week and report content are required.' });
  }

  run(
    `UPDATE reports SET week_of = ?, title = ?, content = ? WHERE id = ?`,
    [week_of, (title || '').trim(), content.trim(), req.params.id]
  );

  res.redirect(`/reports/${req.params.id}`);
};

// POST /reports/:id/delete
exports.delete = (req, res) => {
  run('DELETE FROM reports WHERE id = ?', [req.params.id]);
  res.redirect('/reports');
};
