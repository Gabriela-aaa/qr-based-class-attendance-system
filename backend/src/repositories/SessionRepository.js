class SessionRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findInstructorByUserId(userID, conn = null) {
    const executor = conn || this.pool;
    const [rows] = await executor.execute(
      "SELECT instructor_id AS instructorID FROM instructors WHERE user_id = ?",
      [userID]
    );
    return rows[0] || null;
  }

  async findCourseById(courseID, conn = null) {
    const executor = conn || this.pool;
    const [rows] = await executor.execute(
      "SELECT course_id AS courseID, instructor_id AS instructorID FROM courses WHERE course_id = ?",
      [courseID]
    );
    return rows[0] || null;
  }

  async assignInstructorToCourseIfEmpty({ courseID, instructorID }, conn) {
    const [result] = await conn.execute(
      "UPDATE courses SET instructor_id = ? WHERE course_id = ? AND instructor_id IS NULL",
      [instructorID, courseID]
    );
    return result.affectedRows;
  }

  async createSession({ courseID, sessionDate, startTime, qrCode, gpsLocation }, conn) {
    const [result] = await conn.execute(
      "INSERT INTO class_sessions (course_id, session_date, start_time, status, qr_code, gps_location) VALUES (?, ?, ?, 'open', ?, ?)",
      [courseID, sessionDate, startTime, qrCode, gpsLocation || null]
    );
    return result.insertId;
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
          c.instructor_id AS instructorID
        FROM class_sessions s
        INNER JOIN courses c ON c.course_id = s.course_id
        WHERE s.session_id = ?
      `,
      [sessionID]
    );
    return rows[0] || null;
  }

  async closeSession({ sessionID, endTime }, conn) {
    const [result] = await conn.execute(
      "UPDATE class_sessions SET status = 'closed', end_time = ? WHERE session_id = ? AND status = 'open'",
      [endTime, sessionID]
    );
    return result.affectedRows;
  }

  async listSessionsByInstructor(instructorID) {
    const [rows] = await this.pool.execute(
      `
        SELECT
          s.session_id AS sessionID,
          s.course_id AS courseID,
          c.course_code AS courseCode,
          c.course_name AS courseName,
          s.session_date AS sessionDate,
          s.start_time AS startTime,
          s.end_time AS endTime,
          s.status
        FROM class_sessions s
        INNER JOIN courses c ON c.course_id = s.course_id
        WHERE c.instructor_id = ?
        ORDER BY s.session_id DESC
      `,
      [instructorID]
    );
    return rows;
  }
}

module.exports = SessionRepository;
