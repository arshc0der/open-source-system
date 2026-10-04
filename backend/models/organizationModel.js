import db from "../config/db.js";

class Organization {
  static async create({ name, display_name, description, ownerUserId }) {
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        `INSERT INTO organizations (name, display_name, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [slug, display_name || slug, description || null, new Date(), new Date()]
      );
      const orgId = result.insertId;
      await connection.query(
        `INSERT INTO organization_members (organization_id, user_id, role, created_at)
         VALUES (?, ?, 'owner', ?)`,
        [orgId, ownerUserId, new Date()]
      );
      await connection.commit();
      return this.getById(orgId);
    } catch (error) {
      await connection.rollback();
      if (error.code === "ER_DUP_ENTRY") {
        const err = new Error("organization name already taken");
        err.status = 409;
        throw err;
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getById(id) {
    const [rows] = await db.query("SELECT * FROM organizations WHERE id = ?", [id]);
    return rows[0] || null;
  }

  static async listForUser(userId) {
    const [rows] = await db.query(
      `SELECT o.*, om.role
       FROM organizations o
       INNER JOIN organization_members om ON om.organization_id = o.id
       WHERE om.user_id = ?
       ORDER BY o.name`,
      [userId]
    );
    return rows;
  }

  static async listMembers(orgId) {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.display_name, om.role, om.created_at
       FROM organization_members om
       INNER JOIN users u ON u.id = om.user_id
       WHERE om.organization_id = ?`,
      [orgId]
    );
    return rows;
  }

  static async addMember(orgId, userId, role = "member") {
    await db.query(
      `INSERT INTO organization_members (organization_id, user_id, role, created_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role)`,
      [orgId, userId, role, new Date()]
    );
  }

  static async createTeam({ orgId, name, description }) {
    const [result] = await db.query(
      `INSERT INTO teams (organization_id, name, description, created_at) VALUES (?, ?, ?, ?)`,
      [orgId, name, description || null, new Date()]
    );
    const [rows] = await db.query("SELECT * FROM teams WHERE id = ?", [result.insertId]);
    return rows[0];
  }

  static async listTeams(orgId) {
    const [rows] = await db.query(
      `SELECT t.*, COUNT(tm.user_id) AS member_count
       FROM teams t LEFT JOIN team_members tm ON tm.team_id = t.id
       WHERE t.organization_id = ?
       GROUP BY t.id
       ORDER BY t.name`,
      [orgId]
    );
    return rows;
  }

  static async getMembership(orgId, userId) {
    const [rows] = await db.query(
      "SELECT role FROM organization_members WHERE organization_id = ? AND user_id = ? LIMIT 1",
      [orgId, userId]
    );
    return rows[0] || null;
  }

  static async getTeam(orgId, teamId) {
    const [rows] = await db.query(
      "SELECT * FROM teams WHERE id = ? AND organization_id = ? LIMIT 1",
      [teamId, orgId]
    );
    return rows[0] || null;
  }

  static async listTeamMembers(teamId) {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.display_name, tm.created_at
       FROM team_members tm INNER JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = ? ORDER BY u.username`,
      [teamId]
    );
    return rows;
  }

  static async addTeamMember(teamId, userId) {
    await db.query(
      "INSERT IGNORE INTO team_members (team_id, user_id, created_at) VALUES (?, ?, ?)",
      [teamId, userId, new Date()]
    );
  }

  static async removeTeamMember(teamId, userId) {
    await db.query("DELETE FROM team_members WHERE team_id = ? AND user_id = ?", [teamId, userId]);
  }
}

export default Organization;
