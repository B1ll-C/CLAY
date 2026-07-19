import { pgSchema, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Supabase's own `auth.users` table, modeled just enough to FK against it.
 * Drizzle/drizzle-kit never manages this schema (see `schemaFilter` in
 * drizzle.config.ts) — Supabase Auth owns its shape and migrations.
 */
const authSchema = pgSchema('auth');
export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

/**
 * App-facing profile row, kept in sync with `auth.users` by the
 * `on_auth_user_created` trigger (see backend/supabase/001_sync_auth_users.sql).
 * `id` is Supabase's own user id — never generated locally.
 */
export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
