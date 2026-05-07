const { validationResult } = require("express-validator");

class CourseController {
  constructor(courseService) {
    this.courseService = courseService;
    this.addCourse = this.addCourse.bind(this);
    this.listCourses = this.listCourses.bind(this);
  }

  async addCourse(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    try {
      const result = await this.courseService.addCourse(req.body);
      return res.status(result.statusCode).json(result.payload);
    } catch (error) {
      return next(error);
    }
  }

  async listCourses(req, res, next) {
    try {
      const result = await this.courseService.listCourses({
        userID: req.user.userID,
        role: req.user.role,
      });
      return res.status(result.statusCode).json(result.payload);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = CourseController;

