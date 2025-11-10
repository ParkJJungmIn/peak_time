import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  console.warn("[drizzle] DATABASE_URL is not defined. CLI commands may fail until it is set.");
}
export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    connectionString: encodeURIComponent(process.env.DATABASE_URL) ?? "",
  },
  verbose: true,
  strict: true,
});
