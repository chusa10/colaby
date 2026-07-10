const { all, get, run } = require('../config/db');

// GET /meetings
exports.index = (req, res) => {
  const PAGE_SIZE = 14;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const total = get('SELECT COUNT(*) AS count FROM meetings').count;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const meetings = all(
    `SELECT m.id, m.title, m.date, m.summary, u.name AS author
     FROM meetings m
     LEFT JOIN users u ON u.id = m.user_id
     ORDER BY m.date DESC, m.created_at DESC
     LIMIT ? OFFSET ?`,
    [PAGE_SIZE, offset]
  );

  res.render('meetings/index', {
    meetings,
    page,
    totalPages,
    total,
  });
};

// GET /meetings/new
exports.newForm = (req, res) => {
  res.render('meetings/form', { meeting: null, error: null });
};

// POST /meetings
exports.create = (req, res) => {
  const { title, date, summary, minutes } = req.body;

  if (!title || !date) {
    return res.render('meetings/form', {
      meeting: null,
      error: 'Title and date are required.'
    });
  }

  const { lastInsertRowid } = run(
    `INSERT INTO meetings (title, date, summary, minutes, user_id)
     VALUES (?, ?, ?, ?, ?)`,
    [title.trim(), date, (summary || '').trim(), (minutes || '').trim(), req.session.userId]
  );

  res.redirect(`/meetings/${lastInsertRowid}`);
};

// GET /meetings/:id
exports.view = (req, res) => {
  const meeting = get(
    `SELECT m.*, u.name AS author
     FROM meetings m
     LEFT JOIN users u ON u.id = m.user_id
     WHERE m.id = ?`,
    [req.params.id]
  );
  if (!meeting) return res.status(404).send('Meeting not found.');
  res.render('meetings/view', { meeting });
};

// GET /meetings/:id/edit
exports.editForm = (req, res) => {
  const meeting = get('SELECT * FROM meetings WHERE id = ?', [req.params.id]);
  if (!meeting) return res.status(404).send('Meeting not found.');
  res.render('meetings/form', { meeting, error: null });
};

// POST /meetings/:id
exports.update = (req, res) => {
  const { title, date, summary, minutes } = req.body;

  if (!title || !date) {
    const meeting = get('SELECT * FROM meetings WHERE id = ?', [req.params.id]);
    return res.render('meetings/form', { meeting, error: 'Title and date are required.' });
  }

  run(
    `UPDATE meetings SET title = ?, date = ?, summary = ?, minutes = ? WHERE id = ?`,
    [title.trim(), date, (summary || '').trim(), (minutes || '').trim(), req.params.id]
  );

  res.redirect(`/meetings/${req.params.id}`);
};

// POST /meetings/:id/delete
exports.delete = (req, res) => {
  run('DELETE FROM meetings WHERE id = ?', [req.params.id]);
  res.redirect('/meetings');
};
