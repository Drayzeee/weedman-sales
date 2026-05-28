import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial().primaryKey(),
  identityId: text("identity_id").notNull().unique(),
  email: text().notNull(),
  name: text().notNull().default(""),
  role: text().notNull().default("advisor"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const calls = pgTable("calls", {
  id: serial().primaryKey(),
  userId: integer("user_id").references(() => users.id),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  outcome: text().notNull().default("unknown"),
  stage: text().notNull().default("unknown"),
  objection: text().notNull().default("none"),
  notes: text().notNull().default(""),
  closed: boolean().notNull().default(false),
  calledAt: timestamp("called_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const serviceAvailability = pgTable("service_availability", {
  id: serial().primaryKey(),
  serviceId: text("service_id").notNull(),
  serviceName: text("service_name").notNull(),
  season: text().notNull().default("2026"),
  available: boolean().notNull().default(true),
  maxSlots: integer("max_slots"),
  usedSlots: integer("used_slots").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});
