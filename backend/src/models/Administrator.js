const BaseModel = require("./BaseModel");

/**
 * From doc Table 2.3 (Data Dictionary): Administrator
 * Attributes: adminID, firstName, lastName, userID
 */
class Administrator extends BaseModel {
  constructor({ adminID, firstName, lastName, userID }) {
    super();
    this.adminID = adminID;
    this.firstName = firstName;
    this.lastName = lastName;
    this.userID = userID;
  }

  static async findById(adminID) {
    const rows = await this.query(
      "SELECT admin_id AS adminID, first_name AS firstName, last_name AS lastName, user_id AS userID FROM administrators WHERE admin_id = ?",
      [adminID]
    );
    return rows[0] ? new Administrator(rows[0]) : null;
  }
}

module.exports = Administrator;

