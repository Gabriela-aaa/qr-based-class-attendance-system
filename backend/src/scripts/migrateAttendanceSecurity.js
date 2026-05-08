const mysql = require("mysql2/promise");
const { loadBackendEnv } = require("../config/loadEnv");

loadBackendEnv();

const dbName = process.env.DB_NAME?.trim();
if (!dbName) {
  console.error("FATAL: DB_NAME must be set in backend/.env.");
  process.exit(1);
}

async function hasIndex(connection, tableName, indexName) {
  const [rows] = await connection.execute(
    `
      SELECT 1
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      LIMIT 1
    `,
    [dbName, tableName, indexName]
  );
  return rows.length > 0;
}

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: dbName,
  });

  try {
    if (!(await hasIndex(connection, "class_sessions", "idx_sessions_status_date"))) {
      await connection.execute(
        "ALTER TABLE class_sessions ADD INDEX idx_sessions_status_date (status, session_date)"
      );
      console.log("class_sessions: added idx_sessions_status_date");
    } else {
      console.log("class_sessions: idx_sessions_status_date already exists");
    }

    if (!(await hasIndex(connection, "activity_logs", "idx_logs_timestamp"))) {
      await connection.execute("ALTER TABLE activity_logs ADD INDEX idx_logs_timestamp (timestamp)");
      console.log("activity_logs: added idx_logs_timestamp");
    } else {
      console.log("activity_logs: idx_logs_timestamp already exists");
    }
  } finally {
    await connection.end();
  }
}

runMigration()
  .then(() => {
    console.log("Attendance security migration completed.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Attendance security migration failed.");
    console.error(`Error code: ${err?.code || "UNKNOWN"}`);
    console.error(`Error message: ${err?.message || "No message"}`);
    process.exit(1);
  });
