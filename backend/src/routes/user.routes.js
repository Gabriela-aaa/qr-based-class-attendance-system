const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const authMiddleware = require("../middleware/auth.middleware");
const UserManagementRepository = require("../repositories/UserManagementRepository");
const UserManagementService = require("../services/UserManagementService");
const UserManagementController = require("../controllers/UserManagementController");
const StudentProfileRepository = require("../repositories/StudentProfileRepository");
const StudentProfileService = require("../services/StudentProfileService");
const StudentProfileController = require("../controllers/StudentProfileController");

const router = express.Router();

const userManagementRepository = new UserManagementRepository(pool);
const userManagementService = new UserManagementService({ pool, userManagementRepository });
const userManagementController = new UserManagementController(userManagementService);
const studentProfileRepository = new StudentProfileRepository(pool);
const studentProfileService = new StudentProfileService({ studentProfileRepository });
const studentProfileController = new StudentProfileController(studentProfileService);

router.post(
  "/instructors",
  authMiddleware.requireAuth,
  authMiddleware.requireRole("admin"),
  [
    body("username").trim().isLength({ min: 3, max: 100 }).withMessage("username must be 3-100 chars"),
    body("password").isLength({ min: 6 }).withMessage("password must be at least 6 chars"),
    body("firstName").trim().notEmpty().withMessage("firstName is required"),
    body("lastName").trim().notEmpty().withMessage("lastName is required"),
    body("department").trim().notEmpty().withMessage("department is required"),
  ],
  userManagementController.createInstructorAccount
);

router.get(
  "/me/student-profile",
  authMiddleware.requireAuth,
  authMiddleware.requireRole("student"),
  studentProfileController.getMyProfile
);

router.put(
  "/me/student-profile",
  authMiddleware.requireAuth,
  authMiddleware.requireRole("student"),
  [
    body("firstName").trim().notEmpty().withMessage("firstName is required"),
    body("lastName").trim().notEmpty().withMessage("lastName is required"),
    body("department").trim().notEmpty().withMessage("department is required"),
    body("year").isInt({ min: 1, max: 8 }).withMessage("year must be between 1 and 8"),
  ],
  studentProfileController.updateMyProfile
);

module.exports = router;

