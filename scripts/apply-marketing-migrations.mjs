import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import pg from "pg";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required; no database defaults or seed are allowed");
const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(77432218)");
  await client.query("CREATE TABLE IF NOT EXISTS marketing_schema_migrations(name TEXT PRIMARY KEY,digest TEXT NOT NULL,applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");
  for (const name of (await fs.readdir(dir)).filter(n => /^\d+-marketing-sites\.sql$/.test(n)).sort()) {
    const sql = await fs.readFile(path.join(dir, name), "utf8"), digest = createHash("sha256").update(sql).digest("hex");
    const rows = await client.query("SELECT digest FROM marketing_schema_migrations WHERE name=$1", [name]);
    if (rows.rows.length) { if (rows.rows[0].digest !== digest) throw new Error("Applied marketing migration was modified"); continue; }
    await client.query(sql); await client.query("INSERT INTO marketing_schema_migrations(name,digest) VALUES($1,$2)", [name, digest]);
    console.log(`Applied ${name}`);
  }
  await client.query("COMMIT");
} catch (e) { await client.query("ROLLBACK"); throw e; } finally { await client.end(); }
