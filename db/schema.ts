import {
  boolean,
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core";

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  role: text("role").default("user"),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    precision: 3,
    withTimezone: true,
  })
    .notNull()
    .$onUpdate(() => new Date()),
});

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

export const tokensTable = pgTable("tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => userTable.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  token: text("token"),
  lastSentAt: timestamp("last_sent_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

export type SignUpType = typeof userTable.$inferInsert;

export type TokenType = typeof tokensTable.$inferInsert;
