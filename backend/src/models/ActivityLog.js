const BaseModel = require("./BaseModel");

/**
 * From doc Table 2.3 (Data Dictionary): ActivityLog
 * Attributes: logID, activityType, timestamp
 *
 * Not in your doc (suggestion): store actor userID + metadata. Your use cases include
 * "View System Activity" and the design mentions audit trails.
 */
class ActivityLog extends BaseModel {
  constructor({ logID, activityType, timestamp, userID, metadata }) {
    super();
    this.logID = logID;
    this.activityType = activityType;
    this.timestamp = timestamp;
    this.userID = userID;
    this.metadata = metadata;
  }
}

module.exports = ActivityLog;

