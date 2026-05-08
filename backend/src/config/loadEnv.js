const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

/**
 * Loads env in a consistent order so backend/.env wins over repo-root .env.
 */
function loadBackendEnv() {
  const backendEnvPath = path.resolve(__dirname, "../../.env");
  const rootEnvPath = path.resolve(__dirname, "../../../.env");

  if (fs.existsSync(backendEnvPath)) {
    dotenv.config({ path: backendEnvPath });
  } else if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
    console.warn("Using repo root .env because backend/.env was not found.");
  } else {
    dotenv.config();
    console.warn("No .env file found. Using process environment only.");
  }
}

module.exports = { loadBackendEnv };
