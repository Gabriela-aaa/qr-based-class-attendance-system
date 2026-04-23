class UserManagementRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findUserByUsername(username, conn = null) {
    const executor = conn || this.pool;
    const [rows] = await executor.execute("SELECT user_id FROM users WHERE username = ?", [username]);
    return rows[0] || null;
  }

  async getNextInstructorId(conn) {
    const [rows] = await conn.execute(
      "SELECT COALESCE(MAX(CAST(instructor_id AS UNSIGNED)), 0) + 1 AS next_id FROM instructors"
    );
    return String(rows[0].next_id);
  }

  async createInstructorUser({ username, passwordHash }, conn) {
    const [result] = await conn.execute(
      "INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, 'instructor', 'active')",
      [username, passwordHash]
    );
    return result.insertId;
  }

  async createInstructorProfile({ instructorID, firstName, lastName, department, userID }, conn) {
    await conn.execute(
      "INSERT INTO instructors (instructor_id, first_name, last_name, department, user_id) VALUES (?, ?, ?, ?, ?)",
      [instructorID, firstName, lastName, department, userID]
    );
  }
}

module.exports = UserManagementRepository;

