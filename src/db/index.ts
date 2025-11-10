import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const globalForDb = globalThis as unknown as {
  drizzleDb?: PostgresJsDatabase;
  drizzleClient?: ReturnType<typeof postgres>;
};

export function getDb(): PostgresJsDatabase {
  if (globalForDb.drizzleDb) {
    return globalForDb.drizzleDb;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Check your environment configuration.");
  }

  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

  const client = postgres(connectionString, {
    // Supabase cloud instances require SSL, while local development usually does not.
    ssl: isLocal ? undefined : "require",
    max: 1,
  });

  const db = drizzle(client);

  globalForDb.drizzleClient = client;
  globalForDb.drizzleDb = db;

  return db;
}
