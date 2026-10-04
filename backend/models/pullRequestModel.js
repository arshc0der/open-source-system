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
    return this.attachCommits(rows);
  }

  static async getById(id) {
    const [rows] = await db.query(
      `SELECT p.*, u.username AS author_username
       FROM pull_requests p
       LEFT JOIN users u ON u.id = p.author_user_id
       WHERE p.id = ? LIMIT 1`,
      [id]
    );
    if (!rows[0]) return null;
    return (await this.attachCommits([rows[0]]))[0];
  }

  static async attachCommits(pulls) {
    if (!pulls.length) return pulls;
    const ids = pulls.map((pull) => pull.id);
    const [rows] = await db.query(
      `SELECT pc.pull_request_id, c.id, c.sha, c.commit_message, c.committed_at, u.username AS author_username
       FROM pull_request_commits pc
       INNER JOIN commits c ON c.id = pc.commit_id
       LEFT JOIN users u ON u.id = c.author_user_id
       WHERE pc.pull_request_id IN (${ids.map(() => "?").join(", ")})
       ORDER BY c.committed_at DESC`,
      ids
    );
    const commitsByPull = new Map();
    for (const commit of rows) {
      const commits = commitsByPull.get(commit.pull_request_id) || [];
      commits.push(commit);
      commitsByPull.set(commit.pull_request_id, commits);
    }
    return pulls.map((pull) => ({ ...pull, commits: commitsByPull.get(pull.id) || [] }));
  }

  static async create({ repoId, userId, title, body, source_branch, target_branch, issueId, commitIds = [] }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[n]] = await connection.query(
        "SELECT COALESCE(MAX(pull_number), 0) + 1 AS n FROM pull_requests WHERE repository_id = ?",
        [repoId]
      );
      const [result] = await connection.query(
        `INSERT INTO pull_requests
          (repository_id, author_user_id, issue_id, pull_number, title, body, state, source_branch, target_branch, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)`,
        [
          repoId,
          userId,
          issueId || null,
          n.n,
          title,
          body || null,
          source_branch || "feature",
          target_branch || "main",
          new Date(),
        ]
      );
      for (const commitId of commitIds) {
        await connection.query(
          "INSERT IGNORE INTO pull_request_commits (pull_request_id, commit_id) VALUES (?, ?)",
          [result.insertId, commitId]
        );
      }
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
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query("UPDATE pull_requests SET state = ? WHERE id = ?", [state, id]);
      if (state === "merged") {
        const [[pull]] = await connection.query(
          "SELECT repository_id, target_branch FROM pull_requests WHERE id = ?",
          [id]
        );
        const [[commit]] = await connection.query(
          `SELECT pc.commit_id
           FROM pull_request_commits pc
           INNER JOIN commits c ON c.id = pc.commit_id
           WHERE pc.pull_request_id = ?
           ORDER BY c.committed_at DESC
           LIMIT 1`,
          [id]
        );
        if (pull && commit) {
          await connection.query(
            "UPDATE branches SET head_commit_id = ? WHERE repository_id = ? AND name = ?",
            [commit.commit_id, pull.repository_id, pull.target_branch]
          );
        }
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    return this.getById(id);
  }

  static async belongsToRepo(pullRequestId, repoId) {
    const [rows] = await db.query(
      "SELECT id FROM pull_requests WHERE id = ? AND repository_id = ? LIMIT 1",
      [pullRequestId, repoId]
    );
    return Boolean(rows[0]);
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
