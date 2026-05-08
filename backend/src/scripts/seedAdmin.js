const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
const { loadBackendEnv } = require("../config/loadEnv");

loadBackendEnv();

const username = process.env.ADMIN_SEED_USERNAME || "sys_admin";
const password = process.env.ADMIN_SEED_PASSWORD || "Admin@12345";
const firstName = process.env.ADMIN_SEED_FIRST_NAME || "System";
const lastName = process.env.ADMIN_SEED_LAST_NAME || "Administrator";
const dbName = process.env.DB_NAME?.trim();

if (!dbName) {
  console.error("FATAL: DB_NAME must be set in backend/.env");
  process.exit(1);
}

async function nextAdminId(conn) {
  const [rows] = await conn.execute(
    "SELECT COALESCE(MAX(CAST(admin_id AS UNSIGNED)), 0) + 1 AS next_id FROM administrators"
  );
  return String(rows[0].next_id);
}

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: dbName,
  });

  try {
    const [existing] = await connection.execute(
      "SELECT user_id FROM users WHERE username = ?",
      [username]
    );
    if (existing.length > 0) {
      console.log(`Admin user "${username}" already exists. Skipping seed.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await connection.beginTransaction();

    const [userResult] = await connection.execute(
      "INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, 'admin', 'active')",
      [username, passwordHash]
    );
    const userId = userResult.insertId;
    const adminId = await nextAdminId(connection);

    await connection.execute(
      "INSERT INTO administrators (admin_id, first_name, last_name, user_id) VALUES (?, ?, ?, ?)",
      [adminId, firstName, lastName, userId]
    );

    await connection.commit();
    console.log(`Admin seeded: username="${username}", admin_id="${adminId}"`);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    await connection.end();
  }
}

run().catch((err) => {
  console.error("Admin seed failed:", err.message);
  process.exit(1);
});
