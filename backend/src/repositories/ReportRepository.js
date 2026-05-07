class ReportRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async createReportRecord({ reportType, generatedBy, courseID, sessionID }, conn = null) {
    const executor = conn || this.pool;
    await executor.execute(
      "INSERT INTO reports (report_type, generated_by, course_id, session_id) VALUES (?, ?, ?, ?)",
      [reportType, generatedBy, courseID || null, sessionID || null]
    );
  }

  async getAttendanceSummary({ courseID, sessionID, instructorID = null }) {
    let query = `
      SELECT
        c.course_id AS courseID,
        c.course_code AS courseCode,
        c.course_name AS courseName,
        s.session_id AS sessionID,
        s.session_date AS sessionDate,
        COUNT(a.attendance_id) AS presentCount
      FROM class_sessions s
      INNER JOIN courses c ON c.course_id = s.course_id
      LEFT JOIN attendance a ON a.session_id = s.session_id
      WHERE 1 = 1
    `;
    const params = [];

    if (courseID) {
      query += " AND c.course_id = ?";
      params.push(courseID);
    }
    if (sessionID) {
      query += " AND s.session_id = ?";
      params.push(sessionID);
    }
    if (instructorID) {
      query += " AND c.instructor_id = ?";
      params.push(instructorID);
    }

    query += `
      GROUP BY c.course_id, c.course_code, c.course_name, s.session_id, s.session_date
      ORDER BY s.session_id DESC
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  async getStudentEligibilityByCourse({ courseID, instructorID = null, studentID = null }) {
    let query = `
      SELECT
        st.student_id AS studentID,
        st.first_name AS firstName,
        st.last_name AS lastName,
        c.course_id AS courseID,
        c.course_code AS courseCode,
        COUNT(DISTINCT s.session_id) AS totalSessions,
        COUNT(DISTINCT a.session_id) AS attendedSessions,
        COALESCE(c.eligibility_percentage, 75) AS thresholdPercentage
      FROM students st
      INNER JOIN courses c ON c.course_id = ?
      INNER JOIN class_sessions s ON s.course_id = c.course_id
      LEFT JOIN attendance a ON a.session_id = s.session_id AND a.student_id = st.student_id
      WHERE c.course_id = ?
    `;
    const params = [courseID, courseID];

    if (instructorID) {
      query += " AND c.instructor_id = ?";
      params.push(instructorID);
    }
    if (studentID) {
      query += " AND st.student_id = ?";
      params.push(studentID);
    }

    query += `
      GROUP BY st.student_id, st.first_name, st.last_name, c.course_id, c.course_code, c.eligibility_percentage
      ORDER BY st.student_id ASC
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows.filter((row) => row.studentID);
  }

  async findStudentByUserId(userID) {
    const [rows] = await this.pool.execute(
      "SELECT student_id AS studentID FROM students WHERE user_id = ?",
      [userID]
    );
    return rows[0] || null;
  }

  async findInstructorByUserId(userID) {
    const [rows] = await this.pool.execute(
      "SELECT instructor_id AS instructorID FROM instructors WHERE user_id = ?",
      [userID]
    );
    return rows[0] || null;
  }
}

module.exports = ReportRepository;
