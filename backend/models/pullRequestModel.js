import db from "../config/db.js";
import Notification from "./notificationModel.js";

class PullRequest {
  static async listByRepo(repoId) {
    const [rows] = await db.query(
      `SELECT p.*, u.username AS author_username
       FROM pull_requests p
       LEFT JOIN users u ON u.id = p.author_user_id
       WHERE p.repository_id = ?
       ORDER BY p.pull_number DESC`,
      [repoId]
    );
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query(
      `SELECT p.*, u.username AS author_username
       FROM pull_requests p
       LEFT JOIN users u ON u.id = p.author_user_id
       WHERE p.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async create({ repoId, userId, title, body, source_branch, target_branch }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[n]] = await connection.query(
        "SELECT COALESCE(MAX(pull_number), 0) + 1 AS n FROM pull_requests WHERE repository_id = ?",
        [repoId]
      );
      const [result] = await connection.query(
        `INSERT INTO pull_requests
          (repository_id, author_user_id, pull_number, title, body, state, source_branch, target_branch, created_at)
         VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?)`,
        [
          repoId,
          userId,
          n.n,
          title,
          body || null,
          source_branch || "feature",
          target_branch || "main",
          new Date(),
        ]
      );
      await connection.commit();
      const pr = await this.getById(result.insertId);
      await Notification.notifyRepoWatchers({
        repoId,
        actorId: userId,
        pullRequestId: pr.id,
        type: "pull_request_opened",
      });
      return pr;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async setState(id, state) {
    await db.query("UPDATE pull_requests SET state = ? WHERE id = ?", [state, id]);
    return this.getById(id);
  }

  static async addReview({ pullRequestId, userId, state, body }) {
    const [result] = await db.query(
      `INSERT INTO pull_request_reviews (pull_request_id, author_user_id, state, body, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [pullRequestId, userId, state || "commented", body || null, new Date()]
    );
    const [rows] = await db.query("SELECT * FROM pull_request_reviews WHERE id = ?", [
      result.insertId,
    ]);
    return rows[0];
  }

  static async listReviews(pullRequestId) {
    const [rows] = await db.query(
      `SELECT r.*, u.username AS author_username
       FROM pull_request_reviews r
       LEFT JOIN users u ON u.id = r.author_user_id
       WHERE r.pull_request_id = ?
       ORDER BY r.created_at ASC`,
      [pullRequestId]
    );
    return rows;
  }
}

export default PullRequest;
