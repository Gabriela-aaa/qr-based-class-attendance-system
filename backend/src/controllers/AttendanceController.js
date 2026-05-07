const { validationResult } = require("express-validator");

class AttendanceController {
  constructor(attendanceService) {
    this.attendanceService = attendanceService;
    this.markAttendance = this.markAttendance.bind(this);
    this.getHistory = this.getHistory.bind(this);
  }

  buildRequestContext(req) {
    return {
      ip: req.ip,
      userAgent: req.get("user-agent") || null,
    };
  }

  async markAttendance(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    try {
      const result = await this.attendanceService.markAttendance({
        userID: req.user.userID,
        ...req.body,
        requestContext: this.buildRequestContext(req),
      });
      return res.status(result.statusCode).json(result.payload);
    } catch (error) {
      return next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const result = await this.attendanceService.getHistory({
        userID: req.user.userID,
        role: req.user.role,
      });
      return res.status(result.statusCode).json(result.payload);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = AttendanceController;
