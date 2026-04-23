const BaseModel = require("./BaseModel");

/**
 * From doc Table 2.3 (Data Dictionary): Course
 * Attributes: courseID, courseCode, courseName, department, creditHour, instructorID
 */
class Course extends BaseModel {
  constructor({ courseID, courseCode, courseName, department, creditHour, instructorID }) {
    super();
    this.courseID = courseID;
    this.courseCode = courseCode;
    this.courseName = courseName;
    this.department = department;
    this.creditHour = creditHour;
    this.instructorID = instructorID;
  }

  static async findById(courseID) {
    const rows = await this.query(
      "SELECT course_id AS courseID, course_code AS courseCode, course_name AS courseName, department, credit_hour AS creditHour, instructor_id AS instructorID FROM courses WHERE course_id = ?",
      [courseID]
    );
    return rows[0] ? new Course(rows[0]) : null;
  }
}

module.exports = Course;

