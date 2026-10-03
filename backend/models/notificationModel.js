import db from "../config/db.js";

class Notification {
  static async create({ userId, repositoryId, issueId, pullRequestId, type }) {
    if (!userId) return;
    await db.query(
      `INSERT INTO notifications
        (user_id, repository_id, issue_id, pull_request_id, notification_type, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, FALSE, ?)`,
      [userId, repositoryId || null, issueId || null, pullRequestId || null, type, new Date()]
    );
  }

  static async listForUser(userId) {
    const [rows] = await db.query(
      `SELECT n.*, r.full_name
       FROM notifications n
       LEFT JOIN repositories r ON r.id = n.repository_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );
    return rows;
  }

  static async markRead(id, userId) {
    await db.query("UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);
  }

  static async notifyRepoWatchers({ repoId, actorId, issueId, pullRequestId, type }) {
    const [watchers] = await db.query(
      `SELECT user_id FROM watchers WHERE repository_id = ?
       UNION
       SELECT owner_user_id AS user_id FROM repositories WHERE id = ? AND owner_user_id IS NOT NULL`,
      [repoId, repoId]
    );
    const seen = new Set();
    for (const row of watchers) {
      if (!row.user_id || row.user_id === actorId || seen.has(row.user_id)) continue;
      seen.add(row.user_id);
      await this.create({
        userId: row.user_id,
        repositoryId: repoId,
        issueId,
        pullRequestId,
        type,
      });
    }
  }
}

export default Notification;
