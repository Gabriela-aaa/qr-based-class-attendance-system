const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const authMiddleware = require("../middleware/auth.middleware");
const SessionRepository = require("../repositories/SessionRepository");
const ActivityLogRepository = require("../repositories/ActivityLogRepository");
const SessionService = require("../services/SessionService");
const SessionController = require("../controllers/SessionController");

const router = express.Router();

const sessionRepository = new SessionRepository(pool);
const activityLogRepository = new ActivityLogRepository(pool);
const sessionService = new SessionService({ pool, sessionRepository, activityLogRepository });
const sessionController = new SessionController(sessionService);

router.post(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requireRole("instructor"),
  [
    body("courseID").isInt({ min: 1 }).withMessage("courseID is required"),
    body("sessionDate").isISO8601({ strict: true }).withMessage("sessionDate must be a valid ISO date"),
    body("startTime")
      .matches(/^\d{2}:\d{2}(:\d{2})?$/)
      .withMessage("startTime must be HH:MM or HH:MM:SS"),
    body("gpsLocation").optional({ nullable: true }).isString(),
  ],
  sessionController.createSession
);

router.post(
  "/:sessionId/close",
  authMiddleware.requireAuth,
  authMiddleware.requireRole("instructor"),
  sessionController.closeSession
);

router.get(
  "/my",
  authMiddleware.requireAuth,
  authMiddleware.requireRole("instructor"),
  sessionController.listMySessions
);

module.exports = router;

