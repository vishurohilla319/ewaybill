import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // Helpful development warning if DATABASE_URL is missing
  console.warn("⚠️ DATABASE_URL is not set. Neon database features will be inactive.");
}

export const sql = databaseUrl ? neon(databaseUrl) : null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
