import db from "../config/db.js";

class User {
  static async register(user) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [userResult] = await connection.query(
        `INSERT INTO users
          (username, password_hash, display_name, bio, avatar_url, location, company, website_url, is_active, is_admin, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.username,
          user.password_hash,
          user.display_name || user.username,
          user.bio || null,
          user.avatar_url || null,
          user.location || null,
          user.company || null,
          user.website_url || null,
          true,
          false,
          new Date(),
          new Date(),
        ]
      );

      const userId = userResult.insertId;

      await connection.query(
        `INSERT INTO user_emails (user_id, email, is_primary, is_verified, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, user.email, true, false, new Date()]
      );

      await connection.commit();
      return { userId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getByEmail(email) {
    const [rows] = await db.query(
      `SELECT u.*, e.email
       FROM users u
       INNER JOIN user_emails e ON e.user_id = u.id AND e.is_primary = TRUE
       WHERE e.email = ?
       LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  }

  static async getByUsername(username) {
    const [rows] = await db.query(
      `SELECT u.*, e.email
       FROM users u
       LEFT JOIN user_emails e ON e.user_id = u.id AND e.is_primary = TRUE
       WHERE u.username = ?
       LIMIT 1`,
      [username]
    );
    return rows[0] || null;
  }

  static async getAll() {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.display_name, u.bio, u.avatar_url, u.location, u.company, u.website_url, u.created_at, e.email
       FROM users u
       LEFT JOIN user_emails e ON e.user_id = u.id AND e.is_primary = TRUE
       ORDER BY u.created_at DESC`
    );
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query(
      `SELECT u.*, e.email
       FROM users u
       LEFT JOIN user_emails e ON e.user_id = u.id AND e.is_primary = TRUE
       WHERE u.id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async updateProfile(id, fields) {
    const allowed = ["display_name", "bio", "avatar_url", "location", "company", "website_url"];
    const sets = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (!sets.length) return this.getById(id);
    values.push(new Date(), id);
    await db.query(`UPDATE users SET ${sets.join(", ")}, updated_at = ? WHERE id = ?`, values);
    return this.getById(id);
  }

  static async followerCounts(userId) {
    const [[followers]] = await db.query(
      "SELECT COUNT(*) AS count FROM followers WHERE followed_user_id = ?",
      [userId]
    );
    const [[following]] = await db.query(
      "SELECT COUNT(*) AS count FROM followers WHERE follower_user_id = ?",
      [userId]
    );
    return { followers: followers.count, following: following.count };
  }
}

export default User;
