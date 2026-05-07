const QRCode = require("qrcode");
const { createQrToken, hashQrToken } = require("../utils/qrToken");

class SessionService {
  constructor({ pool, sessionRepository, activityLogRepository }) {
    this.pool = pool;
    this.sessionRepository = sessionRepository;
    this.activityLogRepository = activityLogRepository;
  }

  normalizeTime(rawTime) {
    return rawTime.length === 5 ? `${rawTime}:00` : rawTime;
  }

  async createSession({ userID, courseID, sessionDate, startTime, gpsLocation, requestContext = {} }) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      const instructor = await this.sessionRepository.findInstructorByUserId(userID, conn);
      if (!instructor) {
        await conn.rollback();
        return { statusCode: 403, payload: { message: "Only instructors can create sessions" } };
      }

      const course = await this.sessionRepository.findCourseById(courseID, conn);
      if (!course) {
        await conn.rollback();
        return { statusCode: 404, payload: { message: "Course not found" } };
      }

      await this.sessionRepository.assignInstructorToCourseIfEmpty(
        { courseID, instructorID: instructor.instructorID },
        conn
      );

      const refreshedCourse = await this.sessionRepository.findCourseById(courseID, conn);
      if (refreshedCourse.instructorID !== instructor.instructorID) {
        await conn.rollback();
        return {
          statusCode: 403,
          payload: { message: "You are not allowed to create sessions for this course" },
        };
      }

      const normalizedStartTime = this.normalizeTime(startTime);
      const sessionID = await this.sessionRepository.createSession(
        {
          courseID,
          sessionDate,
          startTime: normalizedStartTime,
          qrCode: null,
          gpsLocation,
        },
        conn
      );
      const finalToken = createQrToken({
        sessionID,
        courseID,
        instructorID: instructor.instructorID,
      });
      const finalHash = hashQrToken(finalToken);
      await conn.execute("UPDATE class_sessions SET qr_code = ? WHERE session_id = ?", [finalHash, sessionID]);

      await this.activityLogRepository.createLog(
        {
          activityType: "session_created",
          userID,
          metadata: {
            sessionID,
            courseID,
            hasGpsConstraint: Boolean(gpsLocation),
            requestContext,
          },
        },
        conn
      );

      await conn.commit();
      const qrImage = await QRCode.toDataURL(
        JSON.stringify({
          sessionID,
          courseID,
          qrToken: finalToken,
          generatedAt: new Date().toISOString(),
        })
      );

      return {
        statusCode: 201,
        payload: {
          message: "Class session created successfully",
          session: {
            sessionID,
            courseID,
            sessionDate,
            startTime: normalizedStartTime,
            status: "open",
            qrToken: finalToken,
            qrImage,
          },
        },
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async closeSession({ userID, sessionID, requestContext = {} }) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      const instructor = await this.sessionRepository.findInstructorByUserId(userID, conn);
      if (!instructor) {
        await conn.rollback();
        return { statusCode: 403, payload: { message: "Only instructors can close sessions" } };
      }

      const session = await this.sessionRepository.findSessionById(sessionID, conn);
      if (!session) {
        await conn.rollback();
        return { statusCode: 404, payload: { message: "Session not found" } };
      }
      if (session.instructorID !== instructor.instructorID) {
        await conn.rollback();
        return { statusCode: 403, payload: { message: "You are not allowed to close this session" } };
      }

      const nowTime = new Date().toTimeString().slice(0, 8);
      const affectedRows = await this.sessionRepository.closeSession({ sessionID, endTime: nowTime }, conn);
      if (!affectedRows) {
        await conn.rollback();
        return { statusCode: 409, payload: { message: "Session is already closed" } };
      }

      await this.activityLogRepository.createLog(
        {
          activityType: "session_closed",
          userID,
          metadata: { sessionID, requestContext },
        },
        conn
      );

      await conn.commit();
      return { statusCode: 200, payload: { message: "Session closed successfully" } };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async listMySessions(userID) {
    const instructor = await this.sessionRepository.findInstructorByUserId(userID);
    if (!instructor) {
      return { statusCode: 403, payload: { message: "Only instructors can view sessions" } };
    }
    const sessions = await this.sessionRepository.listSessionsByInstructor(instructor.instructorID);
    return { statusCode: 200, payload: { sessions } };
  }
}

module.exports = SessionService;
