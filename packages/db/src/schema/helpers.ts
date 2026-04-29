import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v7 as uuidv7 } from "uuid";

/**
 * Custom Schema Helpers for DRY database schema definitions
 *
 * These helpers encapsulate common patterns used across all tables:
 * - UUID v7 primary keys
 * - Timestamp fields with automatic defaults
 * - Boolean fields
 * - Consistent table creation
 */

/**
 * Wrapper around sqliteTable for consistent table creation
 * This allows us to add cross-cutting concerns in one place if needed
 */
export const createTable = sqliteTable;

/**
 * Standard UUID v7 primary key field
 * Auto-generates UUID v7 on insert
 */
export const id = text("id")
	.primaryKey()
	.$defaultFn(() => uuidv7());

/**
 * Standard createdAt timestamp field
 * Auto-sets to current timestamp on insert
 */
export const createdAt = integer("created_at", { mode: "timestamp_ms" })
	.notNull()
	.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`);

/**
 * Standard updatedAt timestamp field
 * Auto-sets to current timestamp on insert and update
 */
export const updatedAt = integer("updated_at", { mode: "timestamp_ms" })
	.notNull()
	.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
	.$onUpdate(() => new Date());

/**
 * Boolean field helper
 * SQLite stores booleans as integers (0/1)
 */
export const boolean = (name: string) => integer(name, { mode: "boolean" });

/**
 * Custom timestamp field helper (for non-standard timestamp fields)
 * Use this for fields like expiresAt, lockedAt, paidAt, etc.
 */
export const timestamp = (name: string) =>
	integer(name, { mode: "timestamp_ms" });
