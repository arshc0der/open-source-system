import db from "../config/db.js";
import Notification from "./notificationModel.js";

class Issue {
  static async attachMetadata(issues) {
    if (!issues.length) return issues;
    const ids = issues.map((issue) => issue.id);
    const placeholders = ids.map(() => "?").join(", ");
    const [[labelRows], [assigneeRows]] = await Promise.all([
      db.query(
        `SELECT il.issue_id, l.id, l.name, l.color
         FROM issue_labels il INNER JOIN labels l ON l.id = il.label_id
         WHERE il.issue_id IN (${placeholders})`,
        ids
      ),
      db.query(
        `SELECT ia.issue_id, u.id, u.username
         FROM issue_assignees ia INNER JOIN users u ON u.id = ia.user_id
         WHERE ia.issue_id IN (${placeholders})`,
        ids
      ),
    ]);
    const labelsByIssue = new Map();
    const assigneesByIssue = new Map();
    for (const label of labelRows) {
      const values = labelsByIssue.get(label.issue_id) || [];
      values.push({ id: label.id, name: label.name, color: label.color });
      labelsByIssue.set(label.issue_id, values);
    }
    for (const assignee of assigneeRows) {
      const values = assigneesByIssue.get(assignee.issue_id) || [];
      values.push({ id: assignee.id, username: assignee.username });
      assigneesByIssue.set(assignee.issue_id, values);
    }
    return issues.map((issue) => ({
      ...issue,
      labels: labelsByIssue.get(issue.id) || [],
      assignees: assigneesByIssue.get(issue.id) || [],
    }));
  }

  static async nextNumber(connection, repoId) {
    const [rows] = await connection.query(
      "SELECT COALESCE(MAX(issue_number), 0) + 1 AS n FROM issues WHERE repository_id = ?",
      [repoId]
    );
    return rows[0].n;
  }

  static async listByRepo(repoId) {
    const [rows] = await db.query(
      `SELECT i.*, u.username AS author_username,
        (SELECT COUNT(*) FROM issue_comments c WHERE c.issue_id = i.id) AS comment_count
       FROM issues i
       LEFT JOIN users u ON u.id = i.author_user_id
       WHERE i.repository_id = ?
       ORDER BY i.issue_number DESC`,
      [repoId]
    );
    return this.attachMetadata(rows);
  }

  static async getById(id) {
    const [rows] = await db.query(
      `SELECT i.*, u.username AS author_username
       FROM issues i
       LEFT JOIN users u ON u.id = i.author_user_id
       WHERE i.id = ? LIMIT 1`,
      [id]
    );
    if (!rows[0]) return null;
    return (await this.attachMetadata([rows[0]]))[0];
  }

  static async create({ repoId, userId, title, body, assigneeIds = [], labelIds = [] }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const number = await this.nextNumber(connection, repoId);
      const [result] = await connection.query(
        `INSERT INTO issues (repository_id, author_user_id, issue_number, title, body, state, created_at)
         VALUES (?, ?, ?, ?, ?, 'open', ?)`,
        [repoId, userId, number, title, body || null, new Date()]
      );
      for (const assigneeId of assigneeIds) {
        await connection.query(
          "INSERT INTO issue_assignees (issue_id, user_id) VALUES (?, ?)",
          [result.insertId, assigneeId]
        );
      }
      for (const labelId of labelIds) {
        await connection.query(
          "INSERT INTO issue_labels (issue_id, label_id) VALUES (?, ?)",
          [result.insertId, labelId]
        );
      }
      await connection.commit();
      const issue = await this.getById(result.insertId);
      await Notification.notifyRepoWatchers({
        repoId,
        actorId: userId,
        issueId: issue.id,
        type: "issue_opened",
      });
      return issue;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async setState(id, state) {
    await db.query("UPDATE issues SET state = ? WHERE id = ?", [state, id]);
    return this.getById(id);
  }

  static async belongsToRepo(issueId, repoId) {
    const [rows] = await db.query(
      "SELECT id FROM issues WHERE id = ? AND repository_id = ? LIMIT 1",
      [issueId, repoId]
    );
    return Boolean(rows[0]);
  }

  static async listComments(issueId) {
    const [rows] = await db.query(
      `SELECT c.*, u.username AS author_username
       FROM issue_comments c
       LEFT JOIN users u ON u.id = c.author_user_id
       WHERE c.issue_id = ?
       ORDER BY c.created_at ASC`,
      [issueId]
    );
    return rows;
  }

  static async addComment({ issueId, userId, body }) {
    const [result] = await db.query(
      `INSERT INTO issue_comments (issue_id, author_user_id, body, created_at)
       VALUES (?, ?, ?, ?)`,
      [issueId, userId, body, new Date()]
    );
    const [rows] = await db.query("SELECT * FROM issue_comments WHERE id = ?", [result.insertId]);
    return rows[0];
  }

  static async listLabels(repoId) {
    const [rows] = await db.query("SELECT * FROM labels WHERE repository_id = ?", [repoId]);
    return rows;
  }

  static async createLabel({ repoId, name, color }) {
    const [result] = await db.query(
      `INSERT INTO labels (repository_id, name, color, created_at) VALUES (?, ?, ?, ?)`,
      [repoId, name, (color || "1d4ed8").replace("#", ""), new Date()]
    );
    const [rows] = await db.query("SELECT * FROM labels WHERE id = ?", [result.insertId]);
    return rows[0];
  }
}

export default Issue;
