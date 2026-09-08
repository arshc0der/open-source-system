const db = require('../config/db');

class User {
  // Method to fetch all users from MySQL
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM users');
    return rows;
  }

  // Method to find a user by ID
  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }
}

module.exports = User;
