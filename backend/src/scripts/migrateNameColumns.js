/**
 * Legacy migration hook. Current schema (database/schema.sql + db:init) already uses
 * the expected column names. This script exists so `npm run db:migrate:names` does not fail.
 */
console.log("db:migrate:names: skipped — no pending name-column migrations.");
process.exit(0);
