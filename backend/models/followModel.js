import db from "../config/db.js";

class Follow {
  static async toggle(followerId, followedId) {
    if (followerId === followedId) {
      const err = new Error("cannot follow yourself");
      err.status = 400;
      throw err;
    }
    const [existing] = await db.query(
      "SELECT 1 FROM followers WHERE follower_user_id = ? AND followed_user_id = ?",
      [followerId, followedId]
    );
    if (existing.length) {
      await db.query(
        "DELETE FROM followers WHERE follower_user_id = ? AND followed_user_id = ?",
        [followerId, followedId]
      );
      return { following: false };
    }
    await db.query(
      "INSERT INTO followers (follower_user_id, followed_user_id, created_at) VALUES (?, ?, ?)",
      [followerId, followedId, new Date()]
    );
    return { following: true };
  }
}

export default Follow;
