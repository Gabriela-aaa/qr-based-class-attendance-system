const BaseModel = require("./BaseModel");

/**
 * From doc Table 2.3 (Data Dictionary): ClassSession
 * Attributes: sessionID, courseID, sessionDate, startTime, endTime, status
 *
 * Not in your doc (suggestion): store qrCode + gpsLocation for session-level validation,
 * because the design section references QR and GPS associated with sessions.
 */
class ClassSession extends BaseModel {
  constructor({
    sessionID,
    courseID,
    sessionDate,
    startTime,
    endTime,
    status,
    qrCode,
    gpsLocation,
  }) {
    super();
    this.sessionID = sessionID;
    this.courseID = courseID;
    this.sessionDate = sessionDate;
    this.startTime = startTime;
    this.endTime = endTime;
    this.status = status;
    this.qrCode = qrCode;
    this.gpsLocation = gpsLocation;
  }

  static async findById(sessionID) {
    const rows = await this.query(
      "SELECT session_id AS sessionID, course_id AS courseID, session_date AS sessionDate, start_time AS startTime, end_time AS endTime, status, qr_code AS qrCode, gps_location AS gpsLocation FROM class_sessions WHERE session_id = ?",
      [sessionID]
    );
    return rows[0] ? new ClassSession(rows[0]) : null;
  }
}

module.exports = ClassSession;

