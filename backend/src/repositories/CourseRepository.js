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
}

module.exports = CourseRepository;

