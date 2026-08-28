const { run } = require('../config/db');

const STATUSES = ['New', 'Active', 'Resolved', 'Closed', 'Removed', 'Inactive'];

function featureUrl(p) {
  return `/projects/${p.projectId}/epics/${p.epicId}/features/${p.featureId}`;
}

// POST .../stories/:storyId/tasks
exports.create = (req, res) => {
  const { title, status } = req.body;
  const { storyId } = req.params;

  if (title && title.trim()) {
    run(
      `INSERT INTO story_tasks (story_id, title, status) VALUES (?, ?, ?)`,
      [storyId, title.trim(), STATUSES.includes(status) ? status : 'New']
    );
  }
  res.redirect(featureUrl(req.params));
};

// POST .../stories/:storyId/tasks/:id/status
exports.updateStatus = (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  if (STATUSES.includes(status)) {
    run('UPDATE story_tasks SET status = ? WHERE id = ?', [status, id]);
  }
  res.redirect(featureUrl(req.params));
};

// POST .../stories/:storyId/tasks/:id/edit
exports.update = (req, res) => {
  const { title, status } = req.body;
  const { id } = req.params;
  if (title && title.trim()) {
    run('UPDATE story_tasks SET title = ? WHERE id = ?', [title.trim(), id]);
  }
  if (STATUSES.includes(status)) {
    run('UPDATE story_tasks SET status = ? WHERE id = ?', [status, id]);
  }
  res.redirect(featureUrl(req.params));
};

// POST .../stories/:storyId/tasks/:id/delete
exports.delete = (req, res) => {
  run('DELETE FROM story_tasks WHERE id = ?', [req.params.id]);
  res.redirect(featureUrl(req.params));
};

module.exports.STATUSES = STATUSES;
