const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const authMiddleware = require("../middleware/auth.middleware");
const AttendanceRepository = require("../repositories/AttendanceRepository");
const ActivityLogRepository = require("../repositories/ActivityLogRepository");
const AttendanceService = require("../services/AttendanceService");
const AttendanceController = require("../controllers/AttendanceController");

const router = express.Router();

const attendanceRepository = new AttendanceRepository(pool);
const activityLogRepository = new ActivityLogRepository(pool);
const attendanceService = new AttendanceService({ pool, attendanceRepository, activityLogRepository });
const attendanceController = new AttendanceController(attendanceService);

router.post(
  "/mark",
  authMiddleware.requireAuth,
  authMiddleware.requireRole("student"),
  [
    body("sessionID").isInt({ min: 1 }).withMessage("sessionID is required"),
    body("qrToken")
      .trim()
      .isLength({ min: 20, max: 2048 })
      .withMessage("qrToken is required and must be valid"),
    body("gpsLocation").optional({ nullable: true }).isString(),
  ],
  attendanceController.markAttendance
);

router.get(
  "/history",
  authMiddleware.requireAuth,
  authMiddleware.requireRole("student", "instructor"),
  attendanceController.getHistory
);

module.exports = router;

