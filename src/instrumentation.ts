/**
 * Runs once when the Node.js server boots: applies database migrations
 * (see lib/migrate.ts). Set DB_MIGRATE=false to opt out.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DB_MIGRATE === "false") return;
  const { runMigrations } = await import("./lib/migrate");
  await runMigrations();
}
