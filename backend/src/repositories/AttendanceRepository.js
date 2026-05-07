class AttendanceRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findStudentByUserId(userID, conn = null) {
    const executor = conn || this.pool;
    const [rows] = await executor.execute(
      "SELECT student_id AS studentID FROM students WHERE user_id = ?",
      [userID]
    );
    return rows[0] || null;
  }

  async findSessionById(sessionID, conn = null) {
    const executor = conn || this.pool;
    const [rows] = await executor.execute(
      `
        SELECT
          s.session_id AS sessionID,
          s.course_id AS courseID,
          s.session_date AS sessionDate,
          s.start_time AS startTime,
          s.end_time AS endTime,
          s.status,
          s.qr_code AS qrCode,
          s.gps_location AS gpsLocation,
          c.instructor_id AS instructorID,
          c.course_code AS courseCode,
          c.course_name AS courseName
        FROM class_sessions s
        INNER JOIN courses c ON c.course_id = s.course_id
        WHERE s.session_id = ?
      `,
      [sessionID]
    );
    return rows[0] || null;
  }

  async findAttendance(studentID, sessionID, conn = null) {
    const executor = conn || this.pool;
    const [rows] = await executor.execute(
      "SELECT attendance_id AS attendanceID FROM attendance WHERE student_id = ? AND session_id = ?",
      [studentID, sessionID]
    );
    return rows[0] || null;
  }

  async createAttendance({ studentID, sessionID, qrCode, gpsLocation }, conn) {
    const [result] = await conn.execute(
      "INSERT INTO attendance (student_id, session_id, status, qr_code, gps_location) VALUES (?, ?, 'present', ?, ?)",
      [studentID, sessionID, qrCode, gpsLocation || null]
    );
    return result.insertId;
  }

  async getStudentHistory(studentID) {
    const [rows] = await this.pool.execute(
      `
        SELECT
          a.attendance_id AS attendanceID,
          a.marked_at AS markedAt,
          a.status,
          a.session_id AS sessionID,
          c.course_code AS courseCode,
          c.course_name AS courseName,
          s.session_date AS sessionDate,
          s.start_time AS startTime
        FROM attendance a
        INNER JOIN class_sessions s ON s.session_id = a.session_id
        INNER JOIN courses c ON c.course_id = s.course_id
        WHERE a.student_id = ?
        ORDER BY a.attendance_id DESC
      `,
      [studentID]
    );
    return rows;
  }

  async getInstructorCourseHistory(instructorID) {
    const [rows] = await this.pool.execute(
      `
        SELECT
          a.attendance_id AS attendanceID,
          a.student_id AS studentID,
          a.marked_at AS markedAt,
          a.status,
          s.session_id AS sessionID,
          c.course_code AS courseCode,
          c.course_name AS courseName,
          s.session_date AS sessionDate
        FROM attendance a
        INNER JOIN class_sessions s ON s.session_id = a.session_id
        INNER JOIN courses c ON c.course_id = s.course_id
        WHERE c.instructor_id = ?
        ORDER BY a.attendance_id DESC
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

module.exports = AttendanceRepository;
