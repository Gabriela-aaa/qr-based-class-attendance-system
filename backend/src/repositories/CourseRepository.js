class CourseRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findByCourseCode(courseCode, conn = null) {
    const executor = conn || this.pool;
    const [rows] = await executor.execute("SELECT course_id FROM courses WHERE course_code = ?", [
      courseCode,
    ]);
    return rows[0] || null;
  }

  async createCourse({ courseCode, courseName, department, creditHour }, conn) {
    const [result] = await conn.execute(
      "INSERT INTO courses (course_code, course_name, department, credit_hour, instructor_id) VALUES (?, ?, ?, ?, NULL)",
      [courseCode, courseName, department, creditHour]
    );
    return result.insertId;
  }

  async listAllCourses() {
    const [rows] = await this.pool.execute(
      `
        SELECT
          c.course_id AS courseID,
          c.course_code AS courseCode,
          c.course_name AS courseName,
          c.department,
          c.credit_hour AS creditHour,
          c.instructor_id AS instructorID
        FROM courses c
        ORDER BY c.course_id DESC
      `
    );
    return rows;
  }

  async listInstructorCourses(instructorID) {
    const [rows] = await this.pool.execute(
      `
        SELECT
          c.course_id AS courseID,
          c.course_code AS courseCode,
          c.course_name AS courseName,
          c.department,
          c.credit_hour AS creditHour,
          c.instructor_id AS instructorID
        FROM courses c
        WHERE c.instructor_id = ?
        ORDER BY c.course_id DESC
      `,
      [instructorID]
    );
    return rows;
  }

  async findInstructorByUserId(userID) {
    const [rows] = await this.pool.execute(
      "SELECT instructor_id AS instructorID FROM instructors WHERE user_id = ?",
      [userID]
    );
    return rows[0] || null;
  }
}

module.exports = CourseRepository;

