const BaseModel = require("./BaseModel");

/**
 * From doc Table 2.3 (Data Dictionary): User
 * Attributes: userID, username, password, role, status, createdAt
 */
class User extends BaseModel {
  constructor({ userID, username, password, role, status, createdAt }) {
    super();
    this.userID = userID;
    this.username = username;
    this.password = password;
    this.role = role;
    this.status = status;
    this.createdAt = createdAt;
  }

  static async findById(userID) {
    const rows = await this.query(
      "SELECT user_id AS userID, username, password_hash AS password, role, status, created_at AS createdAt FROM users WHERE user_id = ?",
      [userID]
    );
    return rows[0] ? new User(rows[0]) : null;
  }

  static async findByUsername(username) {
    const rows = await this.query(
      "SELECT user_id AS userID, username, password_hash AS password, role, status, created_at AS createdAt FROM users WHERE username = ?",
      [username]
    );
    return rows[0] ? new User(rows[0]) : null;
  }
}

module.exports = User;

