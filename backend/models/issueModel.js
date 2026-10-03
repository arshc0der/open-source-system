import db from "../config/db.js";
import Notification from "./notificationModel.js";

class Issue {
  static async nextNumber(connection, repoId) {
    const [rows] = await connection.query(
      "SELECT COALESCE(MAX(issue_number), 0) + 1 AS n FROM issues WHERE repository_id = ?",
      [repoId]
    );
    return rows[0].n;
  }

  static async listByRepo(repoId) {
    const [rows] = await db.query(
      `SELECT i.*, u.username AS author_username
       FROM issues i
       LEFT JOIN users u ON u.id = i.author_user_id
       WHERE i.repository_id = ?
       ORDER BY i.issue_number DESC`,
      [repoId]
    );
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query(
      `SELECT i.*, u.username AS author_username
       FROM issues i
       LEFT JOIN users u ON u.id = i.author_user_id
       WHERE i.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async create({ repoId, userId, title, body }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const number = await this.nextNumber(connection, repoId);
      const [result] = await connection.query(
        `INSERT INTO issues (repository_id, author_user_id, issue_number, title, body, state, created_at)
         VALUES (?, ?, ?, ?, ?, 'open', ?)`,
        [repoId, userId, number, title, body || null, new Date()]
      );
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
