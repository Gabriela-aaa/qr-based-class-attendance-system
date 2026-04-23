class AuthRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findUserByUsername(username, conn = null) {
    const executor = conn || this.pool;
    const [rows] = await executor.execute(
      "SELECT user_id, username, password_hash, role, status FROM users WHERE username = ?",
      [username]
    );
    return rows[0] || null;
  }

  async findStudentByStudentId(studentID, conn = null) {
    const executor = conn || this.pool;
    const [rows] = await executor.execute("SELECT student_id FROM students WHERE student_id = ?", [studentID]);
    return rows[0] || null;
  }

  async createStudentUser({ username, passwordHash }, conn) {
    const [result] = await conn.execute(
      "INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, 'student', 'active')",
      [username, passwordHash]
    );
    return result.insertId;
  }

  async createStudentProfile({ studentID, firstName, lastName, department, year, userID }, conn) {
    await conn.execute(
      "INSERT INTO students (student_id, first_name, last_name, department, year, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [studentID, firstName, lastName, department, year, userID]
    );
  }
}

module.exports = AuthRepository;

