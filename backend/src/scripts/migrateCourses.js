const mysql = require("mysql2/promise");
require("dotenv").config();

async function hasColumn(connection, columnName) {
  const [rows] = await connection.execute(
    `
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'courses'
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [process.env.DB_NAME || "advanced_attendance", columnName]
  );
  return rows.length > 0;
}

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "advanced_attendance",
  });

  try {
    const hasCourseCode = await hasColumn(connection, "course_code");
    if (!hasCourseCode) {
      await connection.execute(
        "ALTER TABLE courses ADD COLUMN course_code VARCHAR(50) NULL AFTER course_id"
      );
      await connection.execute(
        "UPDATE courses SET course_code = CONCAT('COURSE-', LPAD(course_id, 4, '0')) WHERE course_code IS NULL OR course_code = ''"
      );
      await connection.execute("ALTER TABLE courses MODIFY COLUMN course_code VARCHAR(50) NOT NULL");
      await connection.execute("ALTER TABLE courses ADD UNIQUE KEY uq_courses_course_code (course_code)");
      console.log("courses: added course_code and populated defaults");
    } else {
      console.log("courses: course_code already exists");
    }

    await connection.execute("ALTER TABLE courses MODIFY COLUMN instructor_id VARCHAR(50) NULL");
    console.log("courses: instructor_id set to NULLABLE");
  } finally {
    await connection.end();
  }
}

runMigration()
  .then(() => {
    console.log("Course schema migration completed.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Course schema migration failed.");
    console.error(`Error code: ${err?.code || "UNKNOWN"}`);
    console.error(`Error message: ${err?.message || "No message"}`);
    process.exit(1);
  });

