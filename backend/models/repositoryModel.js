import crypto from "crypto";
import fs from "node:fs";
import path from "node:path";
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

const repoStorageRoot = path.resolve(process.cwd(), "storage", "repositories");

class Repository {
  static normalizeRelativePath(input = "") {
    const raw = String(input).replace(/\\/g, "/").replace(/^\/+/, "");
    const cleaned = raw.replace(/^\.\//, "");
    const segments = [];

    for (const segment of cleaned.split("/")) {
      if (!segment || segment === "." || /^\s*$/.test(segment)) continue;
      if (segment === "..") {
        segments.pop();
        continue;
      }
      segments.push(segment);
    }

    return segments.join("/");
  }

  static getRepoStorageDir(repoId) {
    return path.join(repoStorageRoot, String(repoId));
  }

  static ensureStarterFiles(repo) {
    const repoDir = this.getRepoStorageDir(repo.id);
    fs.mkdirSync(path.join(repoDir, "src"), { recursive: true });

    const starterFiles = {
      "README.md": `# ${repo.name}\n\n${repo.description || "Repository created with Open Source System."}\n`,
      ".gitignore": "node_modules/\n.env\n",
    };

    for (const [relativePath, content] of Object.entries(starterFiles)) {
      const absolutePath = path.join(repoDir, relativePath);
      if (fs.existsSync(absolutePath)) continue;
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, content, "utf8");
    }
  }

  static async saveUploadedFileTree(repoId, files = []) {
    const uploaded = Array.isArray(files) ? files : [];
    if (!uploaded.length) return [];

    const repoDir = this.getRepoStorageDir(repoId);
    fs.mkdirSync(repoDir, { recursive: true });

    const entries = [];
    for (const entry of uploaded) {
      if (!entry || typeof entry.path !== "string") continue;
      const relativePath = this.normalizeRelativePath(entry.path);
      if (!relativePath) continue;

      const absolutePath = path.join(repoDir, relativePath);
      const entryType = entry.isDirectory || entry.type === "directory";

      if (entryType) {
        fs.mkdirSync(absolutePath, { recursive: true });
        entries.push({
          path: relativePath,
          is_directory: true,
          commit_message: entry.commitMessage || "Create folder",
        });
        continue;
      }

      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, typeof entry.content === "string" ? entry.content : "", "utf8");
      entries.push({
        path: relativePath,
        is_directory: false,
        commit_message: entry.commitMessage || "Upload file",
      });
    }

    for (const item of entries) {
      await db.query(
        `INSERT INTO repository_files (repository_id, path, is_directory, commit_message, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [repoId, item.path, item.is_directory, item.commit_message, new Date()]
      );
    }

    return entries;
  }

  static readFileContent(repoId, filePath) {
    const baseDir = this.getRepoStorageDir(repoId);
    const normalized = this.normalizeRelativePath(filePath);
    if (!normalized) {
      const err = new Error("file path is required");
      err.status = 400;
      throw err;
    }

    const resolved = path.resolve(baseDir, normalized);
    const baseRoot = path.resolve(baseDir);
    if (resolved !== baseRoot && !resolved.startsWith(`${baseRoot}${path.sep}`)) {
      const err = new Error("invalid file path");
      err.status = 400;
      throw err;
    }

    if (!fs.existsSync(resolved)) {
      const err = new Error("file not found");
      err.status = 404;
      throw err;
    }

    return fs.readFileSync(resolved, "utf8");
  }

  static async canWrite(repoId, userId) {
    if (!userId) return false;
    const [[result]] = await db.query(
      `SELECT EXISTS (
         SELECT 1 FROM repositories r
         WHERE r.id = ? AND (
           r.owner_user_id = ?
           OR EXISTS (
             SELECT 1 FROM repository_members rm
             WHERE rm.repository_id = r.id AND rm.user_id = ? AND rm.permission IN ('write', 'admin')
           )
           OR EXISTS (
             SELECT 1 FROM organization_members om
             WHERE om.organization_id = r.owner_organization_id AND om.user_id = ? AND om.role IN ('owner', 'admin')
           )
         )
       ) AS can_write`,
      [repoId, userId, userId, userId]
    );
    return Boolean(result.can_write);
  }

  static async canRead(repoId, userId) {
    if (!userId) return false;
    const [[result]] = await db.query(
      `SELECT EXISTS (
         SELECT 1 FROM repositories r
         WHERE r.id = ? AND (
           r.visibility = 'public'
           OR r.owner_user_id = ?
           OR EXISTS (
             SELECT 1 FROM repository_members rm
             WHERE rm.repository_id = r.id AND rm.user_id = ?
           )
           OR EXISTS (
             SELECT 1 FROM organization_members om
             WHERE om.organization_id = r.owner_organization_id AND om.user_id = ?
           )
         )
       ) AS can_read`,
      [repoId, userId, userId, userId]
    );
    return Boolean(result.can_read);
  }

  static async commitFile({ repoId, userId, filePath, content, message, branchName }) {
    const normalized = this.normalizeRelativePath(filePath);
    if (!normalized) {
      const err = new Error("file path is required");
      err.status = 400;
      throw err;
    }

    const repoDir = this.getRepoStorageDir(repoId);
    const absolutePath = path.resolve(repoDir, normalized);
    const baseDir = path.resolve(repoDir);
    if (absolutePath === baseDir || !absolutePath.startsWith(`${baseDir}${path.sep}`)) {
      const err = new Error("invalid file path");
      err.status = 400;
      throw err;
    }
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
      const err = new Error("file path points to a directory");
      err.status = 400;
      throw err;
    }

    const branch = branchName || (await this.getById(repoId))?.default_branch || "main";
    const previousContent = fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath) : null;
    const tempPath = `${absolutePath}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`;
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const sha = crypto.randomBytes(20).toString("hex");
      const committedAt = new Date();
      const [commitResult] = await connection.query(
        `INSERT INTO commits (repository_id, sha, author_user_id, commit_message, committed_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [repoId, sha, userId, message, committedAt, committedAt]
      );
      const [branchResult] = await connection.query(
        "UPDATE branches SET head_commit_id = ? WHERE repository_id = ? AND name = ?",
        [commitResult.insertId, repoId, branch]
      );
      if (!branchResult.affectedRows) {
        await connection.query(
          "INSERT INTO branches (repository_id, name, head_commit_id, is_default, created_at) VALUES (?, ?, ?, FALSE, ?)",
          [repoId, branch, commitResult.insertId, committedAt]
        );
      }
      const [fileResult] = await connection.query(
        `UPDATE repository_files
         SET is_directory = FALSE, commit_message = ?, updated_at = ?
         WHERE repository_id = ? AND path = ?`,
        [message, committedAt, repoId, normalized]
      );
      if (!fileResult.affectedRows) {
        await connection.query(
          `INSERT INTO repository_files (repository_id, path, is_directory, commit_message, updated_at)
           VALUES (?, ?, FALSE, ?, ?)`,
          [repoId, normalized, message, committedAt]
        );
      }
      await connection.query("UPDATE repositories SET updated_at = ? WHERE id = ?", [committedAt, repoId]);

      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(tempPath, content, "utf8");
      fs.renameSync(tempPath, absolutePath);
      await connection.commit();
      return {
        path: normalized,
        content,
        commit: { id: commitResult.insertId, sha, message, committed_at: committedAt, branch },
      };
    } catch (error) {
      await connection.rollback();
      if (previousContent === null) fs.rmSync(absolutePath, { force: true });
      else fs.writeFileSync(absolutePath, previousContent);
      if (fs.existsSync(tempPath)) fs.rmSync(tempPath, { force: true });
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateSettings(repoId, fields) {
    const allowed = ["description", "visibility", "language"];
    const sets = [];
    const values = [];
    const current = await this.getById(repoId);
    if (!current) return null;
    if (fields.name !== undefined) {
      const name = String(fields.name).trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      if (!name) {
        const err = new Error("repository name is required");
        err.status = 400;
        throw err;
      }
      const ownerName = current.owner_username || current.owner_organization_name;
      sets.push("name = ?", "full_name = ?");
      values.push(name, `${ownerName}/${name}`);
    }
    for (const key of allowed) {
      if (fields[key] === undefined) continue;
      sets.push(`${key} = ?`);
      values.push(fields[key] || null);
    }
    if (!sets.length) return this.getById(repoId);
    sets.push("updated_at = ?");
    values.push(new Date(), repoId);
    try {
      await db.query(`UPDATE repositories SET ${sets.join(", ")} WHERE id = ?`, values);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        const conflict = new Error("a repository with that name already exists for this owner");
        conflict.status = 409;
        throw conflict;
      }
      throw error;
    }
    return this.getById(repoId);
  }

  static async deleteRepository(repoId) {
    const repoDir = this.getRepoStorageDir(repoId);
    const backupDir = `${repoDir}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.deleted`;
    const connection = await db.getConnection();
    let movedStorage = false;
    try {
      await connection.beginTransaction();
      await connection.query("DELETE FROM repositories WHERE id = ?", [repoId]);
      if (fs.existsSync(repoDir)) {
        fs.renameSync(repoDir, backupDir);
        movedStorage = true;
      }
      await connection.commit();
      if (movedStorage) fs.rmSync(backupDir, { recursive: true, force: true });
      return true;
    } catch (error) {
      await connection.rollback();
      if (movedStorage && fs.existsSync(backupDir)) fs.renameSync(backupDir, repoDir);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async createBranch(repoId, branchName, sourceBranch) {
    const name = String(branchName || "").trim();
    if (!/^[A-Za-z0-9._/-]{1,255}$/.test(name) || name.startsWith("/") || name.endsWith("/") || name.includes("..")) {
      const err = new Error("branch name is invalid");
      err.status = 400;
      throw err;
    }
    const branches = await this.listBranches(repoId);
    const baseBranch = branches.find((branch) => branch.name === sourceBranch)
      || branches.find((branch) => branch.is_default)
      || branches[0];
    if (!baseBranch) {
      const err = new Error("source branch not found");
      err.status = 404;
      throw err;
    }
    try {
      const [result] = await db.query(
        "INSERT INTO branches (repository_id, name, head_commit_id, is_default, created_at) VALUES (?, ?, ?, FALSE, ?)",
        [repoId, name, baseBranch.head_commit_id, new Date()]
      );
      const [rows] = await db.query("SELECT * FROM branches WHERE repository_id = ? AND name = ?", [repoId, name]);
      return rows[0] || { id: result.insertId, repository_id: repoId, name, head_commit_id: baseBranch.head_commit_id, is_default: false };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        const err = new Error("branch already exists");
        err.status = 409;
        throw err;
      }
      throw error;
    }
  }

  static async deleteFileWithCommit({ repoId, userId, filePath, message, branchName }) {
    const normalized = this.normalizeRelativePath(filePath);
    if (!normalized) {
      const err = new Error("file path is required");
      err.status = 400;
      throw err;
    }
    const repoDir = this.getRepoStorageDir(repoId);
    const absolutePath = path.resolve(repoDir, normalized);
    const baseDir = path.resolve(repoDir);
    if (!absolutePath.startsWith(`${baseDir}${path.sep}`)) {
      const err = new Error("invalid file path");
      err.status = 400;
      throw err;
    }
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      const err = new Error("file not found");
      err.status = 404;
      throw err;
    }
    const branch = branchName || (await this.getById(repoId))?.default_branch || "main";
    const backupPath = `${absolutePath}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.deleted`;
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const sha = crypto.randomBytes(20).toString("hex");
      const committedAt = new Date();
      const [commitResult] = await connection.query(
        `INSERT INTO commits (repository_id, sha, author_user_id, commit_message, committed_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [repoId, sha, userId, message, committedAt, committedAt]
      );
      const [branchResult] = await connection.query(
        "UPDATE branches SET head_commit_id = ? WHERE repository_id = ? AND name = ?",
        [commitResult.insertId, repoId, branch]
      );
      if (!branchResult.affectedRows) {
        await connection.query(
          "INSERT INTO branches (repository_id, name, head_commit_id, is_default, created_at) VALUES (?, ?, ?, FALSE, ?)",
          [repoId, branch, commitResult.insertId, committedAt]
        );
      }
      await connection.query("DELETE FROM repository_files WHERE repository_id = ? AND path = ?", [repoId, normalized]);
      await connection.query("UPDATE repositories SET updated_at = ? WHERE id = ?", [committedAt, repoId]);
      fs.renameSync(absolutePath, backupPath);
      await connection.commit();
      fs.rmSync(backupPath, { force: true });
      return { path: normalized, commit: { id: commitResult.insertId, sha, message, committed_at: committedAt, branch } };
    } catch (error) {
      await connection.rollback();
      if (fs.existsSync(backupPath)) fs.renameSync(backupPath, absolutePath);
      throw error;
    } finally {
      connection.release();
    }
  }

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

  static async listPublicByOwnerUser(userId) {
    const [rows] = await db.query(
      `${repoSelect} WHERE r.owner_user_id = ? AND r.visibility = 'public' ORDER BY r.updated_at DESC`,
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

  static async create({ ownerUserId, ownerOrganizationId = null, name, description, visibility, language, files = [] }) {
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const ownerRows = ownerOrganizationId
      ? await db.query("SELECT name FROM organizations WHERE id = ?", [ownerOrganizationId])
      : await db.query("SELECT username AS name FROM users WHERE id = ?", [ownerUserId]);
    const ownerName = ownerRows[0][0]?.name;
    if (!ownerName) {
      const err = new Error("owner not found");
      err.status = 404;
      throw err;
    }
    const fullName = `${ownerName}/${slug}`;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        `INSERT INTO repositories
          (owner_user_id, owner_organization_id, name, full_name, description, visibility, default_branch, is_fork, language, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'main', FALSE, ?, ?, ?)`,
        [ownerOrganizationId ? null : ownerUserId, ownerOrganizationId, slug, fullName, description || null, visibility || "public", language || null, new Date(), new Date()]
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
      this.ensureStarterFiles({ id: repoId, name: slug, description });
      await this.saveUploadedFileTree(repoId, files);
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

  static async listCollaborators(repoId) {
    const [rows] = await db.query(
      `SELECT DISTINCT u.id, u.username
       FROM users u
       INNER JOIN repository_members rm ON rm.user_id = u.id
       WHERE rm.repository_id = ?
       UNION
       SELECT u.id, u.username
       FROM users u
       INNER JOIN repositories r ON r.owner_user_id = u.id
       WHERE r.id = ?`,
      [repoId, repoId]
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

  static async toggleWatcher(repoId, userId) {
    const [existing] = await db.query(
      "SELECT 1 FROM watchers WHERE repository_id = ? AND user_id = ?",
      [repoId, userId]
    );
    if (existing.length) {
      await db.query("DELETE FROM watchers WHERE repository_id = ? AND user_id = ?", [repoId, userId]);
      return false;
    }
    await db.query(
      "INSERT INTO watchers (repository_id, user_id, created_at) VALUES (?, ?, ?)",
      [repoId, userId, new Date()]
    );
    return true;
  }

  static async isWatching(repoId, userId) {
    if (!userId) return false;
    const [rows] = await db.query(
      "SELECT 1 FROM watchers WHERE repository_id = ? AND user_id = ? LIMIT 1",
      [repoId, userId]
    );
    return rows.length > 0;
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
