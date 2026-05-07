class ActivityLogRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async createLog({ activityType, userID, metadata }, conn = null) {
    const executor = conn || this.pool;
    await executor.execute(
      "INSERT INTO activity_logs (activity_type, user_id, metadata) VALUES (?, ?, ?)",
      [activityType, userID || null, JSON.stringify(metadata || {})]
    );
  }

  async listLogs(limit = 100) {
    const [rows] = await this.pool.execute(
      `
        SELECT
          l.log_id AS logID,
          l.activity_type AS activityType,
          l.timestamp,
          l.user_id AS userID,
          u.username,
          l.metadata
        FROM activity_logs l
        LEFT JOIN users u ON u.user_id = l.user_id
        ORDER BY l.log_id DESC
        LIMIT ?
      `,
      [Number(limit)]
    );
    return rows.map((row) => {
      let metadata = null;
      if (row.metadata) {
        try {
          metadata = JSON.parse(row.metadata);
        } catch (error) {
          metadata = null;
        }
      }
      return { ...row, metadata };
    });
  }
}

module.exports = ActivityLogRepository;
