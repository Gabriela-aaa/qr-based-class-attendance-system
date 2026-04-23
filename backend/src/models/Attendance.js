const BaseModel = require("./BaseModel");

/**
 * From doc Table 2.3 (Data Dictionary): Attendance
 * Attributes: attendanceID, studentID, sessionID, timestamp, status
 *
 * Not in your doc (suggestion): capture qrCode + gpsLocation evidence per marking
 * (your design/ER narrative mentions storing these for verification).
 */
class Attendance extends BaseModel {
  constructor({
    attendanceID,
    studentID,
    sessionID,
    timestamp,
    status,
    qrCode,
    gpsLocation,
  }) {
    super();
    this.attendanceID = attendanceID;
    this.studentID = studentID;
    this.sessionID = sessionID;
    this.timestamp = timestamp;
    this.status = status;
    this.qrCode = qrCode;
    this.gpsLocation = gpsLocation;
  }

  static async findById(attendanceID) {
    const rows = await this.query(
      "SELECT attendance_id AS attendanceID, student_id AS studentID, session_id AS sessionID, marked_at AS timestamp, status, qr_code AS qrCode, gps_location AS gpsLocation FROM attendance WHERE attendance_id = ?",
      [attendanceID]
    );
    return rows[0] ? new Attendance(rows[0]) : null;
  }
}

module.exports = Attendance;

