const BaseModel = require("./BaseModel");

/**
 * From doc Table 2.3 (Data Dictionary): Report
 * Attributes: reportID, reportType, generatedBy, generatedDate
 *
 * Not in your doc (suggestion): link report to course/session for traceability.
 */
class Report extends BaseModel {
  constructor({
    reportID,
    reportType,
    generatedBy,
    generatedDate,
    courseID,
    sessionID,
  }) {
    super();
    this.reportID = reportID;
    this.reportType = reportType;
    this.generatedBy = generatedBy;
    this.generatedDate = generatedDate;
    this.courseID = courseID;
    this.sessionID = sessionID;
  }
}

module.exports = Report;

