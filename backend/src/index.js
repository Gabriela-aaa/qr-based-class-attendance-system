const { loadBackendEnv } = require("./config/loadEnv");

loadBackendEnv();

if (!process.env.DB_NAME?.trim()) {
  console.error(
    "FATAL: DB_NAME is required. Set DB_NAME in backend/.env to the database name that exists in MySQL (e.g. from phpMyAdmin)."
  );
  process.exit(1);
}

const app = require("./app");
const {
  pingDatabase,
  getDbConfigSummary,
  summarizeDbError,
} = require("./config/database");

const PORT = process.env.PORT || 5000;

function printDbHelp(error) {
  const summary = summarizeDbError(error);
  const config = getDbConfigSummary();
  console.error("MySQL connection failed — backend will not start.");
  console.error(`- code: ${summary.code}`);
  console.error(`- message: ${summary.message}`);
  console.error(
    `- target: ${config.user}@${config.host}:${config.port}/${config.database}`
  );
  if (summary.code === "ER_BAD_DB_ERROR") {
    console.error(
      `Database "${config.database}" does not exist. Create it in MySQL or run: npm run db:init`
    );
  } else if (summary.code === "ER_ACCESS_DENIED_ERROR") {
    console.error("Check DB_USER and DB_PASSWORD in backend/.env.");
  } else if (summary.code === "ECONNREFUSED") {
    console.error("MySQL server is not reachable. Start MySQL and retry.");
  }
}

async function start() {
  try {
    await pingDatabase();
    const cfg = getDbConfigSummary();
    console.log(
      `MySQL connection OK — database "${cfg.database}" at ${cfg.host}:${cfg.port}`
    );
  } catch (err) {
    printDbHelp(err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

start();
