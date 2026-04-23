class StudentProfileRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async getStudentProfileByUserId(userID) {
    const [rows] = await this.pool.execute(
      `
        SELECT
          s.student_id AS studentID,
          s.first_name AS firstName,
          s.last_name AS lastName,
          s.department,
          s.year,
          u.username
        FROM students s
        INNER JOIN users u ON u.user_id = s.user_id
        WHERE s.user_id = ?
      `,
      [userID]
    );
    return rows[0] || null;
  }

  async updateStudentProfileByUserId({ userID, firstName, lastName, department, year }) {
    const [result] = await this.pool.execute(
      `
        UPDATE students
        SET first_name = ?, last_name = ?, department = ?, year = ?
        WHERE user_id = ?
      `,
      [firstName, lastName, department, year, userID]
    );
    return result.affectedRows;
  }
}

module.exports = StudentProfileRepository;

