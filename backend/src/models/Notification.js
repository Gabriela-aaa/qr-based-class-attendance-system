const BaseModel = require("./BaseModel");

/**
 * From doc Table 2.3 (Data Dictionary): Notification
 * Attributes: notificationID, message, recipientID, sentDate
 */
class Notification extends BaseModel {
  constructor({ notificationID, message, recipientID, sentDate }) {
    super();
    this.notificationID = notificationID;
    this.message = message;
    this.recipientID = recipientID;
    this.sentDate = sentDate;
  }
}

module.exports = Notification;

