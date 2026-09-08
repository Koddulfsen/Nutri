import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations need DDL, so they use the owner role. The application runtime
    // uses DATABASE_URL, which is a least-privilege role that deliberately
    // cannot CREATE, ALTER or DROP anything.
    // Falls back to DATABASE_URL so a fresh checkout without the extra variable
    // still works — but a real environment should set both.
    url: process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
