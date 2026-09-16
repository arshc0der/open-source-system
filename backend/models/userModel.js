import db from '../config/db.js'

class User {
  //Method to register user
  static async register(user) {
  const [rows] = await db.query(
    `INSERT INTO users
    (username, display_name, bio, avatar_url, location, company, website_url, is_active, is_admin, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.username,
      user.display_name,
      user.bio,
      user.avatar_url,
      user.location,
      user.company,
      user.website_url,
      user.is_active,
      user.is_admin,
      new Date(),
      new Date()
    ]
  );

  return rows;
}
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

export default User;