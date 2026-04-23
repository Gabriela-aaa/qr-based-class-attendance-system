const BaseModel = require("./BaseModel");

/**
 * From doc Table 2.3 (Data Dictionary): Instructor
 * Attributes: instructorID, firstName, lastName, department, userID
 */
class Instructor extends BaseModel {
  constructor({ instructorID, firstName, lastName, department, userID }) {
    super();
    this.instructorID = instructorID;
    this.firstName = firstName;
    this.lastName = lastName;
    this.department = department;
    this.userID = userID;
  }

  static async findById(instructorID) {
    const rows = await this.query(
      "SELECT instructor_id AS instructorID, first_name AS firstName, last_name AS lastName, department, user_id AS userID FROM instructors WHERE instructor_id = ?",
      [instructorID]
    );
    return rows[0] ? new Instructor(rows[0]) : null;
  }
}

module.exports = Instructor;

