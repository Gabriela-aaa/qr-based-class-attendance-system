const express = require("express");
const { pool } = require("../config/database");
const authMiddleware = require("../middleware/auth.middleware");
const ReportRepository = require("../repositories/ReportRepository");
const ActivityLogRepository = require("../repositories/ActivityLogRepository");
const ReportService = require("../services/ReportService");
const ReportController = require("../controllers/ReportController");

const router = express.Router();

const reportRepository = new ReportRepository(pool);
const activityLogRepository = new ActivityLogRepository(pool);
const reportService = new ReportService({ reportRepository, activityLogRepository });
const reportController = new ReportController(reportService);

router.get(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requireRole("admin", "instructor"),
  reportController.getSummary
);

router.get(
  "/eligibility/my",
  authMiddleware.requireAuth,
  authMiddleware.requireRole("student"),
  reportController.getMyEligibility
);

router.get(
  "/activity-logs",
  authMiddleware.requireAuth,
  authMiddleware.requireRole("admin"),
  reportController.getActivityLogs
);

router.get(
  "/export",
  authMiddleware.requireAuth,
  authMiddleware.requireRole("admin", "instructor"),
  reportController.exportSummary
);

module.exports = router;

