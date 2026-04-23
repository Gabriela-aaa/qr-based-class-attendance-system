const BaseModel = require("./BaseModel");

/**
 * From doc Table 2.3 (Data Dictionary): Student
 * Attributes: studentID, firstName, lastName, department, year, userID
 */
class Student extends BaseModel {
  constructor({ studentID, firstName, lastName, department, year, userID }) {
    super();
    this.studentID = studentID;
    this.firstName = firstName;
    this.lastName = lastName;
    this.department = department;
    this.year = year;
    this.userID = userID;
  }

  static async findById(studentID) {
    const rows = await this.query(
      "SELECT student_id AS studentID, first_name AS firstName, last_name AS lastName, department, year, user_id AS userID FROM students WHERE student_id = ?",
      [studentID]
    );
    return rows[0] ? new Student(rows[0]) : null;
  }
}

module.exports = Student;

