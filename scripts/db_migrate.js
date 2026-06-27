#!/usr/bin/env node
/**
 * Apply SQL migrations to Supabase Postgres.
 *
 *   node scripts/db_migrate.js
 *
 * Runs every .sql file in supabase/migrations in filename order. Migrations are
 * written to be idempotent, so re-running is safe.
 *
 * Requires a direct Postgres connection string in the environment, since the
 * Supabase service-role key (PostgREST) cannot run DDL. Set ONE of:
 *   SUPABASE_DB_URL  (recommended)
 *   DATABASE_URL
 * Get it from Supabase dashboard -> Project Settings -> Database ->
 * "Connection string" (URI). Example:
 *   postgresql://postgres:YOUR-PASSWORD@db.<ref>.supabase.co:5432/postgres
 *
 * If no connection string is set, the SQL is printed so you can paste it into
 * the Supabase SQL Editor instead.
 */
try { require("dotenv").config({ path: ".env.local" }); } catch (e) {}
try { require("dotenv").config(); } catch (e) {}

const fs = require("fs");
const path = require("path");

const MIGRATIONS_DIR = path.join(__dirname, "..", "supabase", "migrations");

function loadMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => ({ name: f, sql: fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8") }));
}

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  const migrations = loadMigrations();

  if (!migrations.length) {
    console.log("No migrations found in supabase/migrations.");
    return;
  }

  if (!connectionString) {
    console.error("No SUPABASE_DB_URL / DATABASE_URL set — cannot connect to Postgres.\n");
    console.error("Either add the connection string to .env.local and rerun, or paste the");
    console.error("following SQL into the Supabase SQL Editor:\n");
    console.error("----------------------------------------------------------------");
    migrations.forEach((m) => console.error(`-- ${m.name}\n${m.sql}`));
    console.error("----------------------------------------------------------------");
    process.exit(1);
  }

  let Client;
  try {
    ({ Client } = require("pg"));
  } catch (e) {
    console.error('The "pg" package is required. Install it with: npm install pg');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    for (const m of migrations) {
      process.stdout.write(`Applying ${m.name} ... `);
      await client.query(m.sql);
      console.log("done");
    }
    console.log("\nAll migrations applied.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\nMigration failed:", err.message || err);
  process.exit(1);
});
