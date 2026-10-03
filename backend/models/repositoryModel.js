import crypto from "crypto";
import db from "../config/db.js";

const repoSelect = `
  SELECT r.*,
    u.username AS owner_username,
    o.name AS owner_organization_name,
    (SELECT COUNT(*) FROM stars s WHERE s.repository_id = r.id) AS star_count,
    (SELECT COUNT(*) FROM watchers w WHERE w.repository_id = r.id) AS watcher_count,
    (SELECT COUNT(*) FROM commits c WHERE c.repository_id = r.id) AS commit_count
  FROM repositories r
  LEFT JOIN users u ON u.id = r.owner_user_id
  LEFT JOIN organizations o ON o.id = r.owner_organization_id
`;

class Repository {
  static async listPublic({ q } = {}) {
    const params = [];
    let sql = `${repoSelect} WHERE r.visibility = 'public'`;
    if (q) {
      sql += " AND (r.name LIKE ? OR r.description LIKE ? OR r.full_name LIKE ?)";
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    sql += " ORDER BY star_count DESC, r.updated_at DESC";
    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async listByOwnerUser(userId) {
    const [rows] = await db.query(
      `${repoSelect} WHERE r.owner_user_id = ? ORDER BY r.updated_at DESC`,
      [userId]
    );
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query(`${repoSelect} WHERE r.id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  static async getByFullName(fullName) {
    const [rows] = await db.query(`${repoSelect} WHERE r.full_name = ? LIMIT 1`, [fullName]);
    return rows[0] || null;
  }

  static async create({ ownerUserId, name, description, visibility, language }) {
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const owner = await db.query("SELECT username FROM users WHERE id = ?", [ownerUserId]);
    const username = owner[0][0]?.username;
    if (!username) {
      const err = new Error("owner not found");
      err.status = 404;
      throw err;
    }
    const fullName = `${username}/${slug}`;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        `INSERT INTO repositories
          (owner_user_id, owner_organization_id, name, full_name, description, visibility, default_branch, is_fork, language, created_at, updated_at)
         VALUES (?, NULL, ?, ?, ?, ?, 'main', FALSE, ?, ?, ?)`,
        [ownerUserId, slug, fullName, description || null, visibility || "public", language || null, new Date(), new Date()]
      );
      const repoId = result.insertId;

      await connection.query(
        `INSERT INTO repository_members (repository_id, user_id, permission, created_at)
         VALUES (?, ?, 'admin', ?)`,
        [repoId, ownerUserId, new Date()]
      );

      const sha = crypto.randomBytes(20).toString("hex");
      const [commitResult] = await connection.query(
        `INSERT INTO commits (repository_id, sha, author_user_id, commit_message, committed_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [repoId, sha, ownerUserId, "Initial commit", new Date(), new Date()]
      );

      await connection.query(
        `INSERT INTO branches (repository_id, name, head_commit_id, is_default, created_at)
         VALUES (?, 'main', ?, TRUE, ?)`,
        [repoId, commitResult.insertId, new Date()]
      );

      const starterFiles = [
        { path: "README.md", is_directory: false, commit_message: "Add setup instructions" },
        { path: "src", is_directory: true, commit_message: "Scaffold source tree" },
        { path: ".gitignore", is_directory: false, commit_message: "Initial payload" },
      ];
      for (const file of starterFiles) {
        await connection.query(
          `INSERT INTO repository_files (repository_id, path, is_directory, commit_message, updated_at)
           VALUES (?, ?, ?, ?, ?)`,
          [repoId, file.path, file.is_directory, file.commit_message, new Date()]
        );
      }

      await connection.commit();
      return this.getById(repoId);
    } catch (error) {
      await connection.rollback();
      if (error.code === "ER_DUP_ENTRY") {
        const err = new Error("repository name already exists for this owner");
        err.status = 409;
        throw err;
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  static async fork(sourceRepoId, userId) {
    const source = await this.getById(sourceRepoId);
    if (!source) {
      const err = new Error("repository not found");
      err.status = 404;
      throw err;
    }
    const [[user]] = await db.query("SELECT username FROM users WHERE id = ?", [userId]);
    const fullName = `${user.username}/${source.name}`;
    const [result] = await db.query(
      `INSERT INTO repositories
        (owner_user_id, name, full_name, description, visibility, default_branch, is_fork, parent_repository_id, language, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'public', ?, TRUE, ?, ?, ?, ?)`,
      [userId, source.name, fullName, source.description, source.default_branch, source.id, source.language, new Date(), new Date()]
    );
    return this.getById(result.insertId);
  }

  static async listCommits(repoId) {
    const [rows] = await db.query(
      `SELECT c.*, u.username AS author_username
       FROM commits c
       LEFT JOIN users u ON u.id = c.author_user_id
       WHERE c.repository_id = ?
       ORDER BY c.committed_at DESC`,
      [repoId]
    );
    return rows;
  }

  static async addCommit(repoId, userId, message) {
    const sha = crypto.randomBytes(20).toString("hex");
    const [result] = await db.query(
      `INSERT INTO commits (repository_id, sha, author_user_id, commit_message, committed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [repoId, sha, userId, message, new Date(), new Date()]
    );
    await db.query(
      `UPDATE branches SET head_commit_id = ? WHERE repository_id = ? AND is_default = TRUE`,
      [result.insertId, repoId]
    );
    return { id: result.insertId, sha };
  }

  static async listBranches(repoId) {
    const [rows] = await db.query("SELECT * FROM branches WHERE repository_id = ?", [repoId]);
    return rows;
  }

  static async listFiles(repoId) {
    const [rows] = await db.query(
      "SELECT * FROM repository_files WHERE repository_id = ? ORDER BY is_directory DESC, path ASC",
      [repoId]
    );
    return rows;
  }

  static async toggleStar(repoId, userId) {
    const [existing] = await db.query(
      "SELECT 1 FROM stars WHERE repository_id = ? AND user_id = ?",
      [repoId, userId]
    );
    if (existing.length) {
      await db.query("DELETE FROM stars WHERE repository_id = ? AND user_id = ?", [repoId, userId]);
      return { starred: false };
    }
    await db.query(
      "INSERT INTO stars (repository_id, user_id, created_at) VALUES (?, ?, ?)",
      [repoId, userId, new Date()]
    );
    return { starred: true };
  }

  static async isStarred(repoId, userId) {
    if (!userId) return false;
    const [rows] = await db.query(
      "SELECT 1 FROM stars WHERE repository_id = ? AND user_id = ? LIMIT 1",
      [repoId, userId]
    );
    return rows.length > 0;
  }

  static async setTopics(repoId, topicNames = []) {
    await db.query("DELETE FROM repository_topics WHERE repository_id = ?", [repoId]);
    for (const raw of topicNames) {
      const name = String(raw).trim().toLowerCase();
      if (!name) continue;
      await db.query("INSERT IGNORE INTO topics (name) VALUES (?)", [name]);
      const [[topic]] = await db.query("SELECT id FROM topics WHERE name = ?", [name]);
      await db.query(
        "INSERT IGNORE INTO repository_topics (repository_id, topic_id) VALUES (?, ?)",
        [repoId, topic.id]
      );
    }
  }

  static async getTopics(repoId) {
    const [rows] = await db.query(
      `SELECT t.name FROM topics t
       INNER JOIN repository_topics rt ON rt.topic_id = t.id
       WHERE rt.repository_id = ?`,
      [repoId]
    );
    return rows.map((r) => r.name);
  }
}

export default Repository;
