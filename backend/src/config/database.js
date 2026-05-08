const mysql = require("mysql2/promise");

function getRequiredDbName() {
  const name = process.env.DB_NAME?.trim();
  if (!name) {
    console.error(
      "FATAL: DB_NAME is not set. Add DB_NAME to backend/.env (must match your MySQL database name)."
    );
    process.exit(1);
  }
  return name;
}

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: getRequiredDbName(),
};

const pool = mysql.createPool({
  ...DB_CONFIG,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

const dbState = {
  connected: false,
  lastError: null,
  lastCheckedAt: null,
};

function summarizeDbError(error) {
  const code = error?.code || "UNKNOWN";
  const message = error?.message || "No error details available";
  return { code, message };
}

async function pingDatabase() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    dbState.connected = true;
    dbState.lastError = null;
    dbState.lastCheckedAt = new Date().toISOString();
    return true;
  } catch (error) {
    dbState.connected = false;
    dbState.lastError = summarizeDbError(error);
    dbState.lastCheckedAt = new Date().toISOString();
    throw error;
  } finally {
    conn.release();
  }
}

function getDbState() {
  return { ...dbState };
}

function getDbConfigSummary() {
  return {
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    database: DB_CONFIG.database,
  };
}

module.exports = {
  pool,
  pingDatabase,
  getDbState,
  getDbConfigSummary,
  summarizeDbError,
};
