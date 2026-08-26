const { all, get, run } = require('../config/db');

const STATUSES = ['New', 'Active', 'Resolved', 'Closed', 'Removed', 'Inactive'];

// POST /projects/:projectId/epics/:epicId/features/:featureId/stories
exports.create = (req, res) => {
  const { title, status } = req.body;
  const { projectId, epicId, featureId } = req.params;

  if (!title) return res.redirect(`/projects/${projectId}/epics/${epicId}/features/${featureId}`);

  run(
    `INSERT INTO user_stories (feature_id, title, status) VALUES (?, ?, ?)`,
    [featureId, title.trim(), STATUSES.includes(status) ? status : 'New']
  );
  res.redirect(`/projects/${projectId}/epics/${epicId}/features/${featureId}`);
};

// POST /projects/:projectId/epics/:epicId/features/:featureId/stories/:id/status
exports.updateStatus = (req, res) => {
  const { status } = req.body;
  const { projectId, epicId, featureId, id } = req.params;

  if (STATUSES.includes(status)) {
    run('UPDATE user_stories SET status = ? WHERE id = ?', [status, id]);
  }
  res.redirect(`/projects/${projectId}/epics/${epicId}/features/${featureId}`);
};

// POST /projects/:projectId/epics/:epicId/features/:featureId/stories/:id/edit
exports.update = (req, res) => {
  const { title, status } = req.body;
  const { projectId, epicId, featureId, id } = req.params;

  if (title && title.trim()) {
    run('UPDATE user_stories SET title = ? WHERE id = ?', [title.trim(), id]);
  }
  if (STATUSES.includes(status)) {
    run('UPDATE user_stories SET status = ? WHERE id = ?', [status, id]);
  }
  res.redirect(`/projects/${projectId}/epics/${epicId}/features/${featureId}`);
};

// POST /projects/:projectId/epics/:epicId/features/:featureId/stories/:id/delete
exports.delete = (req, res) => {
  const { projectId, epicId, featureId, id } = req.params;
  run('DELETE FROM user_stories WHERE id = ?', [id]);
  res.redirect(`/projects/${projectId}/epics/${epicId}/features/${featureId}`);
};

module.exports.STATUSES = STATUSES;
