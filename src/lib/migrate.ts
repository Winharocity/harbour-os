import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

/**
 * Applies the Drizzle SQL migrations from ./drizzle so a self-hosted
 * deployment (Docker / Portainer) bootstraps its own schema — just point
 * DATABASE_URL at any Postgres. Retries while waiting for the database
 * container to become ready, and treats an already-populated schema as
 * success so volume restores and concurrent replicas are safe.
 */
export async function runMigrations() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[harbour-os] DATABASE_URL is not set — skipping migrations");
    return;
  }

  const folder = path.join(process.cwd(), "drizzle");
  if (!fs.existsSync(folder)) {
    console.warn("[harbour-os] no migrations folder found — skipping");
    return;
  }

  const attempts = 25;
  for (let i = 1; i <= attempts; i++) {
    const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 4000 });
    try {
      await migrate(drizzle(pool), { migrationsFolder: folder });
      console.log("[harbour-os] database schema is up to date");
      await pool.end();
      return;
    } catch (err) {
      await pool.end().catch(() => {});
      const msg = err instanceof Error ? err.message : String(err);

      // Schema already applied outside the migration journal (e.g. drizzle-kit push)
      if (msg.includes("already exists")) {
        console.log("[harbour-os] schema already present — continuing");
        return;
      }

      const connIssue =
        msg.includes("ECONNREFUSED") ||
        msg.includes("Connection terminated") ||
        msg.includes("timeout") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("getaddrinfo") ||
        msg.includes("ENOTFOUND");

      if (!connIssue) {
        console.error("[harbour-os] migration error:", msg);
        return;
      }
      if (i < attempts) {
        console.log(`[harbour-os] waiting for database… (${i}/${attempts})`);
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        console.error("[harbour-os] gave up waiting for the database");
      }
    }
  }
}
