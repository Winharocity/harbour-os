import "server-only";
import { db } from "@/db";
import { boats, bookings, issues, members, sessions, sorties } from "@/db/schema";
import { and, asc, desc, eq, gte, isNull, sql } from "drizzle-orm";

export type MemberRow = typeof members.$inferSelect;
export type BoatRow = typeof boats.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type BookingRow = typeof bookings.$inferSelect;
export type SortieRow = typeof sorties.$inferSelect;
export type IssueRow = typeof issues.$inferSelect;

/* ------------------------------------------------------------------ */
/*  Fleet (with derived on-water status)                               */
/* ------------------------------------------------------------------ */

export type BoatView = BoatRow & {
  onWater: boolean;
  openIssues: number;
};

export async function getFleet(): Promise<BoatView[]> {
  const rows = await db
    .select({
      boat: boats,
      onWater: sql<boolean>`bool_or(${sorties.id} is not null)`,
      openIssues: sql<number>`coalesce(sum(case when ${issues.status} != 'resolved' then 1 else 0 end), 0)`,
    })
    .from(boats)
    .leftJoin(sorties, and(eq(sorties.boatId, boats.id), isNull(sorties.signedInAt)))
    .leftJoin(issues, eq(issues.boatId, boats.id))
    .groupBy(boats.id)
    .orderBy(asc(boats.type), asc(boats.name));

  return rows.map((r) => ({
    ...r.boat,
    onWater: r.onWater,
    openIssues: Number(r.openIssues),
  }));
}

export async function getIssues(): Promise<(IssueRow & { boatName: string })[]> {
  const rows = await db
    .select({ issue: issues, boatName: boats.name })
    .from(issues)
    .innerJoin(boats, eq(issues.boatId, boats.id))
    .orderBy(
      sql`case when ${issues.status} = 'resolved' then 1 else 0 end`,
      sql`case ${issues.severity} when 'Urgent' then 0 when 'High' then 1 when 'Medium' then 2 else 3 end`,
      desc(issues.createdAt),
    );
  return rows.map((r) => ({ ...r.issue, boatName: r.boatName }));
}

/* ------------------------------------------------------------------ */
/*  Safety board (sorties)                                             */
/* ------------------------------------------------------------------ */

export type SortieView = SortieRow & {
  boatName: string;
  boatClass: string;
  boatType: string;
};

export async function getActiveSorties(): Promise<SortieView[]> {
  const rows = await db
    .select({ s: sorties, boatName: boats.name, boatClass: boats.className, boatType: boats.type })
    .from(sorties)
    .innerJoin(boats, eq(sorties.boatId, boats.id))
    .where(isNull(sorties.signedInAt))
    .orderBy(asc(sorties.signedOutAt));
  return rows.map((r) => ({ ...r.s, ...{ boatName: r.boatName, boatClass: r.boatClass, boatType: r.boatType } }));
}

export async function getRecentSorties(limit = 12): Promise<SortieView[]> {
  const rows = await db
    .select({ s: sorties, boatName: boats.name, boatClass: boats.className, boatType: boats.type })
    .from(sorties)
    .innerJoin(boats, eq(sorties.boatId, boats.id))
    .orderBy(desc(sorties.signedOutAt))
    .limit(limit * 3);
  return rows
    .filter((r) => r.s.signedInAt !== null)
    .slice(0, limit)
    .map((r) => ({ ...r.s, boatName: r.boatName, boatClass: r.boatClass, boatType: r.boatType }));
}

/* ------------------------------------------------------------------ */
/*  Sessions (with bookings + her members)                             */
/* ------------------------------------------------------------------ */

export type BookingView = BookingRow & { memberName: string };
export type SessionView = SessionRow & {
  bookings: BookingView[];
  confirmedCount: number;
  waitlistCount: number;
};

export async function getSessions(fromMidnight = true): Promise<SessionView[]> {
  const now = new Date();
  const start = new Date(now);
  if (fromMidnight) start.setHours(0, 0, 0, 0);

  const rows = await db
    .select()
    .from(sessions)
    .where(gte(sessions.endTime, start))
    .orderBy(asc(sessions.startTime))
    .limit(60);

  if (rows.length === 0) return [];

  const bks = await db
    .select({ b: bookings, memberName: members.name })
    .from(bookings)
    .innerJoin(members, eq(bookings.memberId, members.id))
    .orderBy(asc(bookings.createdAt));

  const bySession = new Map<string, BookingView[]>();
  for (const r of bks) {
    const list = bySession.get(r.b.sessionId) ?? [];
    list.push({ ...r.b, memberName: r.memberName });
    bySession.set(r.b.sessionId, list);
  }

  return rows.map((s) => {
    const list = bySession.get(s.id) ?? [];
    return {
      ...s,
      bookings: list,
      confirmedCount: list.filter((b) => b.status === "confirmed").length,
      waitlistCount: list.filter((b) => b.status === "waitlist").length,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Dashboard summary                                                  */
/* ------------------------------------------------------------------ */

export async function getSummary() {
  const [memberCount] = await db.select({ n: sql<number>`count(*)` }).from(members);
  const fleet = await getFleet();
  const activeSorties = await getActiveSorties();
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  const weekSessions = await db
    .select({ n: sql<number>`count(*)` })
    .from(sessions)
    .where(and(gte(sessions.startTime, now), sql`${sessions.startTime} < ${weekAhead}`));

  return {
    memberCount: Number(memberCount.n),
    boatCount: fleet.length,
    availableCount: fleet.filter((b) => b.status === "available" && !b.onWater).length,
    onWaterCount: activeSorties.length,
    maintenanceCount: fleet.filter((b) => b.status === "maintenance" && !b.onWater).length,
    openIssueCount: fleet.reduce((acc, b) => acc + b.openIssues, 0),
    peopleOnWater: activeSorties.reduce((acc, s) => acc + s.crewCount, 0),
    weekSessionCount: Number(weekSessions[0].n),
    isEmpty: fleet.length === 0 && Number(memberCount.n) === 0,
  };
}

export async function getMembers(): Promise<MemberRow[]> {
  return db.select().from(members).orderBy(asc(members.name));
}
