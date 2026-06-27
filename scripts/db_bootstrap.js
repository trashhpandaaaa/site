#!/usr/bin/env node
/**
 * Full database bootstrap over a direct Postgres connection:
 *   1. supabase/schema.sql        (creates all tables — idempotent)
 *   2. supabase/migrations/*.sql  (incremental DDL — idempotent)
 *   3. supabase/seed.sql          (demo content)
 *
 *   node scripts/db_bootstrap.js
 *
 * Reads DATABASE_URL or SUPABASE_DB_URL. Parses the connection fields by hand so
 * passwords containing "@" / ":" (which break URL parsing) work correctly.
 */
try { require("dotenv").config({ path: ".env.local" }); } catch (e) {}
try { require("dotenv").config(); } catch (e) {}

const fs = require("fs");
const path = require("path");

function parseConnection(raw) {
  let conn = raw.trim().replace(/^["']|["']$/g, "");
  const withoutScheme = conn.replace(/^postgres(ql)?:\/\//i, "");
  const lastAt = withoutScheme.lastIndexOf("@");
  if (lastAt === -1) throw new Error("Connection string missing '@'.");

  const userinfo = withoutScheme.slice(0, lastAt);
  const hostpart = withoutScheme.slice(lastAt + 1);

  const firstColon = userinfo.indexOf(":");
  const user = firstColon === -1 ? userinfo : userinfo.slice(0, firstColon);
  const password = firstColon === -1 ? undefined : userinfo.slice(firstColon + 1);

  const [hostPortDb] = hostpart.split("?");
  const slash = hostPortDb.indexOf("/");
  const database = slash === -1 ? "postgres" : hostPortDb.slice(slash + 1) || "postgres";
  const hostPort = slash === -1 ? hostPortDb : hostPortDb.slice(0, slash);
  const [host, port = "5432"] = hostPort.split(":");

  const dec = (v) => {
    if (v === undefined) return v;
    try { return decodeURIComponent(v); } catch { return v; }
  };

  return {
    user: dec(user),
    password: dec(password),
    host,
    port: Number(port),
    database,
    ssl: { rejectUnauthorized: false }
  };
}

function readSql(rel) {
  const full = path.join(__dirname, "..", rel);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
}

function listMigrations() {
  const dir = path.join(__dirname, "..", "supabase", "migrations");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => ({ name: `migrations/${f}`, sql: fs.readFileSync(path.join(dir, f), "utf8") }));
}

async function main() {
  const raw = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!raw) {
    console.error("Set DATABASE_URL or SUPABASE_DB_URL in .env.local first.");
    process.exit(1);
  }

  let Client;
  try { ({ Client } = require("pg")); }
  catch { console.error('Install the driver first: npm install pg'); process.exit(1); }

  const config = parseConnection(raw);
  console.log(`Connecting to ${config.host}:${config.port}/${config.database} as ${config.user} …`);
  const client = new Client(config);
  await client.connect();

  const steps = [];
  const schema = readSql("supabase/schema.sql");
  if (schema) steps.push({ name: "schema.sql", sql: schema });
  steps.push(...listMigrations());
  const seed = readSql("supabase/seed.sql");
  if (seed) steps.push({ name: "seed.sql", sql: seed });

  try {
    for (const step of steps) {
      process.stdout.write(`Running ${step.name} … `);
      await client.query(step.sql);
      console.log("ok");
    }

    console.log("\nRow counts:");
    for (const table of ["trending_topics", "battles", "reviews", "reels", "featured_stories", "site_stats"]) {
      try {
        const { rows } = await client.query(`select count(*)::int as n from ${table}`);
        console.log(`  ${table}: ${rows[0].n}`);
      } catch (e) {
        console.log(`  ${table}: (n/a)`);
      }
    }
    console.log("\nDone — database is set up and seeded.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\nBootstrap failed:", err.message || err);
  process.exit(1);
});
