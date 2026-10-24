import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * HARBOUR OS — sailing centre schema
 *
 * Status vocabularies (enforced at the application layer):
 *  - boats.status:          "available" | "maintenance"
 *  - sessions.type:         "Course" | "Training" | "Club" | "Racing" | "Rental"
 *  - bookings.status:       "confirmed" | "waitlist"
 *  - issues.severity:       "Low" | "Medium" | "High" | "Urgent"
 *  - issues.status:         "open" | "in_progress" | "resolved"
 */

export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  qualification: text("qualification").notNull().default("None"),
  membershipType: text("membership_type").notNull().default("Adult"),
  emergencyContact: text("emergency_contact"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const boats = pgTable("boats", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  className: text("class").notNull().default(""),
  type: text("type").notNull().default("Dinghy"),
  sailNumber: text("sail_number"),
  capacity: integer("capacity").notNull().default(2),
  status: text("status").notNull().default("available"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    type: text("type").notNull().default("Training"),
    level: text("level").notNull().default("All levels"),
    instructor: text("instructor"),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    capacity: integer("capacity").notNull().default(8),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sessions_start_idx").on(t.startTime)],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("confirmed"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("bookings_session_idx").on(t.sessionId)],
);

/**
 * A sortie = one boat signed out onto the water.
 * This powers the live safety board ("who is afloat right now").
 */
export const sorties = pgTable(
  "sorties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    boatId: uuid("boat_id")
      .notNull()
      .references(() => boats.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").references(() => members.id, {
      onDelete: "set null",
    }),
    helmName: text("helm_name").notNull(),
    crewCount: integer("crew_count").notNull().default(1),
    purpose: text("purpose").notNull().default("Free sail"),
    area: text("area"),
    signedOutAt: timestamp("signed_out_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    signedInAt: timestamp("signed_in_at", { withTimezone: true }),
    notes: text("notes"),
  },
  (t) => [index("sorties_active_idx").on(t.signedInAt)],
);

export const issues = pgTable(
  "issues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    boatId: uuid("boat_id")
      .notNull()
      .references(() => boats.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    details: text("details"),
    severity: text("severity").notNull().default("Medium"),
    status: text("status").notNull().default("open"),
    reportedBy: text("reported_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [index("issues_boat_idx").on(t.boatId)],
);
