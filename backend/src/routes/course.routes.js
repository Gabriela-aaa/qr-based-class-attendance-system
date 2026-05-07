const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../config/database");
const authMiddleware = require("../middleware/auth.middleware");
const CourseRepository = require("../repositories/CourseRepository");
const CourseService = require("../services/CourseService");
const CourseController = require("../controllers/CourseController");

const router = express.Router();

const courseRepository = new CourseRepository(pool);
const courseService = new CourseService({ pool, courseRepository });
const courseController = new CourseController(courseService);

router.post(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requireRole("admin"),
  [
    body("courseCode")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("courseCode must be 2-50 chars"),
    body("courseName")
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage("courseName must be 2-200 chars"),
    body("department").trim().notEmpty().withMessage("department is required"),
    body("creditHour").isInt({ min: 1, max: 12 }).withMessage("creditHour must be 1-12"),
  ],
  courseController.addCourse
);

router.get("/", authMiddleware.requireAuth, courseController.listCourses);

module.exports = router;

