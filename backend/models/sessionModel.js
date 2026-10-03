import crypto from "crypto";
import db from "../config/db.js";

class Session {
  static async create({ userId, tokenHash, expiresAt }) {
    const id = crypto.randomUUID();
    await db.query(
      `INSERT INTO user_sessions (id, user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, userId, tokenHash, expiresAt, new Date()]
    );
    return id;
  }

  static async findValid(tokenHash) {
    const [rows] = await db.query(
      `SELECT * FROM user_sessions WHERE token_hash = ? AND expires_at > NOW() LIMIT 1`,
      [tokenHash]
    );
    return rows[0] || null;
  }

  static async revoke(tokenHash) {
    await db.query("DELETE FROM user_sessions WHERE token_hash = ?", [tokenHash]);
  }
}

export default Session;
