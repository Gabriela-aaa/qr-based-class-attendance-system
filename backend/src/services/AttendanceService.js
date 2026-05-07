const { verifyQrToken, hashQrToken, timingSafeHashEqual } = require("../utils/qrToken");

class AttendanceService {
  constructor({ pool, attendanceRepository, activityLogRepository }) {
    this.pool = pool;
    this.attendanceRepository = attendanceRepository;
    this.activityLogRepository = activityLogRepository;
  }

  buildSessionWindowUtc(sessionDate, startTime, endTime) {
    const datePart = String(sessionDate).slice(0, 10);
    const startPart = String(startTime).slice(0, 8);
    const start = new Date(`${datePart}T${startPart}Z`);
    let end;
    if (endTime) {
      const endPart = String(endTime).slice(0, 8);
      end = new Date(`${datePart}T${endPart}Z`);
    } else {
      const maxMinutes = Number(process.env.SESSION_MAX_OPEN_MINUTES || 240);
      end = new Date(start.getTime() + maxMinutes * 60 * 1000);
    }
    return { start, end };
  }

  async logRejectedAttendance({ userID, sessionID, reason, requestContext }, conn) {
    await this.activityLogRepository.createLog(
      {
        activityType: "attendance_rejected",
        userID,
        metadata: { sessionID, reason, requestContext },
      },
      conn
    );
  }

  async markAttendance({ userID, sessionID, qrToken, gpsLocation, requestContext = {} }) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      const student = await this.attendanceRepository.findStudentByUserId(userID, conn);
      if (!student) {
        await this.logRejectedAttendance({
          userID,
          sessionID,
          reason: "non_student_user",
          requestContext,
        }, conn);
        await conn.rollback();
        return { statusCode: 403, payload: { message: "Only students can mark attendance" } };
      }

      const session = await this.attendanceRepository.findSessionById(sessionID, conn);
      if (!session) {
        await this.logRejectedAttendance({
          userID,
          sessionID,
          reason: "session_not_found",
          requestContext,
        }, conn);
        await conn.rollback();
        return { statusCode: 404, payload: { message: "Session not found" } };
      }
      if (session.status !== "open") {
        await this.logRejectedAttendance({
          userID,
          sessionID,
          reason: "session_closed",
          requestContext,
        }, conn);
        await conn.rollback();
        return { statusCode: 409, payload: { message: "Session is closed" } };
      }

      let tokenPayload;
      try {
        tokenPayload = verifyQrToken(qrToken);
      } catch (error) {
        await this.logRejectedAttendance({
          userID,
          sessionID,
          reason: "invalid_or_expired_qr_token",
          requestContext,
        }, conn);
        await conn.rollback();
        return { statusCode: 400, payload: { message: "Invalid or expired QR token" } };
      }

      if (Number(tokenPayload.sid) !== Number(sessionID)) {
        await this.logRejectedAttendance({
          userID,
          sessionID,
          reason: "token_session_mismatch",
          requestContext,
        }, conn);
        await conn.rollback();
        return { statusCode: 400, payload: { message: "QR token does not belong to this session" } };
      }

      const tokenHash = hashQrToken(qrToken);
      if (!timingSafeHashEqual(session.qrCode, tokenHash)) {
        await this.logRejectedAttendance({
          userID,
          sessionID,
          reason: "token_hash_mismatch",
          requestContext,
        }, conn);
        await conn.rollback();
        return { statusCode: 400, payload: { message: "QR token mismatch for session" } };
      }

      const now = new Date();
      const { start, end } = this.buildSessionWindowUtc(session.sessionDate, session.startTime, session.endTime);
      if (now < start) {
        await this.logRejectedAttendance({
          userID,
          sessionID,
          reason: "window_not_started",
          requestContext,
        }, conn);
        await conn.rollback();
        return { statusCode: 409, payload: { message: "Attendance window has not started yet" } };
      }
      if (now > end) {
        await this.logRejectedAttendance({
          userID,
          sessionID,
          reason: "window_expired",
          requestContext,
        }, conn);
        await conn.rollback();
        return { statusCode: 409, payload: { message: "Attendance window has ended" } };
      }

      if (session.gpsLocation && !gpsLocation) {
        await this.logRejectedAttendance({
          userID,
          sessionID,
          reason: "missing_gps_location",
          requestContext,
        }, conn);
        await conn.rollback();
        return { statusCode: 400, payload: { message: "GPS location is required for this session" } };
      }

      const exists = await this.attendanceRepository.findAttendance(student.studentID, sessionID, conn);
      if (exists) {
        await this.logRejectedAttendance({
          userID,
          sessionID,
          reason: "duplicate_scan",
          requestContext,
        }, conn);
        await conn.rollback();
        return { statusCode: 409, payload: { message: "Attendance already marked for this session" } };
      }

      const attendanceID = await this.attendanceRepository.createAttendance(
        {
          studentID: student.studentID,
          sessionID,
          qrCode: qrToken,
          gpsLocation,
        },
        conn
      );

      await this.activityLogRepository.createLog(
        {
          activityType: "attendance_marked",
          userID,
          metadata: { attendanceID, sessionID, requestContext },
        },
        conn
      );

      await conn.commit();
      return {
        statusCode: 201,
        payload: {
          message: "Attendance marked successfully",
          attendance: {
            attendanceID,
            sessionID,
            courseCode: session.courseCode,
            courseName: session.courseName,
            status: "present",
          },
        },
      };
    } catch (error) {
      await conn.rollback();
      if (error?.code === "ER_DUP_ENTRY") {
        return { statusCode: 409, payload: { message: "Attendance already marked for this session" } };
      }
      throw error;
    } finally {
      conn.release();
    }
  }

  async getHistory({ userID, role }) {
    if (role === "student") {
      const student = await this.attendanceRepository.findStudentByUserId(userID);
      if (!student) {
        return { statusCode: 404, payload: { message: "Student profile not found" } };
      }
      const history = await this.attendanceRepository.getStudentHistory(student.studentID);
      return { statusCode: 200, payload: { history } };
    }

    if (role === "instructor") {
      const instructor = await this.attendanceRepository.findInstructorByUserId(userID);
      if (!instructor) {
        return { statusCode: 404, payload: { message: "Instructor profile not found" } };
      }
      const history = await this.attendanceRepository.getInstructorCourseHistory(instructor.instructorID);
      return { statusCode: 200, payload: { history } };
    }

    return { statusCode: 403, payload: { message: "Access denied" } };
  }
}

module.exports = AttendanceService;
