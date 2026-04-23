const fs = require("fs/promises");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

async function initDb() {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || "root";

  const schemaPath = path.resolve(__dirname, "../../database/schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  try {
    await connection.query(schemaSql);
    console.log("Database schema initialized successfully.");
  } finally {
    await connection.end();
  }
}

initDb().catch((err) => {
  const base = "Failed to initialize schema.";
  const details = {
    code: err?.code || "UNKNOWN",
    message: err?.message || "No error message from driver",
  };

  console.error(base);
  console.error(`Connection target: ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 3306}`);
  console.error(`DB user: ${process.env.DB_USER || "root"}`);
  console.error(`Error code: ${details.code}`);
  console.error(`Error message: ${details.message}`);

  if (details.code === "ECONNREFUSED") {
    console.error("Hint: MySQL server is not running or not listening on the configured host/port.");
  }

  if (details.code === "ER_ACCESS_DENIED_ERROR") {
    console.error("Hint: Check DB_USER and DB_PASSWORD in your backend .env file.");
  }

  process.exit(1);
});

