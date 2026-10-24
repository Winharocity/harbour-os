"use server";

import { db } from "@/db";
import { boats, bookings, issues, members, sessions, sorties } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/water");
  revalidatePath("/schedule");
  revalidatePath("/fleet");
  revalidatePath("/members");
}

/* ------------------------------------------------------------------ */
/*  Members                                                            */
/* ------------------------------------------------------------------ */

export async function addMember(fd: FormData) {
  const name = str(fd.get("name"));
  if (!name) throw new Error("Name is required");
  await db.insert(members).values({
    name,
    email: str(fd.get("email")) || null,
    phone: str(fd.get("phone")) || null,
    qualification: str(fd.get("qualification")) || "None",
    membershipType: str(fd.get("membershipType")) || "Adult",
    emergencyContact: str(fd.get("emergencyContact")) || null,
  });
  refresh();
}

export async function removeMember(id: string) {
  await db.delete(members).where(eq(members.id, id));
  refresh();
}

/* ------------------------------------------------------------------ */
/*  Boats                                                              */
/* ------------------------------------------------------------------ */

export async function addBoat(fd: FormData) {
  const name = str(fd.get("name"));
  if (!name) throw new Error("Name is required");
  await db.insert(boats).values({
    name,
    className: str(fd.get("className")),
    type: str(fd.get("type")) || "Dinghy",
    sailNumber: str(fd.get("sailNumber")) || null,
    capacity: Math.max(1, Number(fd.get("capacity")) || 2),
    notes: str(fd.get("notes")) || null,
  });
  refresh();
}

export async function setBoatStatus(id: string, status: "available" | "maintenance") {
  await db.update(boats).set({ status }).where(eq(boats.id, id));
  refresh();
}

export async function removeBoat(id: string) {
  await db.delete(boats).where(eq(boats.id, id));
  refresh();
}

/* ------------------------------------------------------------------ */
/*  Sessions & bookings                                                */
/* ------------------------------------------------------------------ */

export async function addSession(fd: FormData) {
  const title = str(fd.get("title"));
  const date = str(fd.get("date"));
  const start = str(fd.get("start"));
  const end = str(fd.get("end"));
  if (!title || !date || !start || !end) throw new Error("Missing fields");

  const startTime = new Date(`${date}T${start}:00`);
  const endTime = new Date(`${date}T${end}:00`);
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime()) || endTime <= startTime) {
    throw new Error("Invalid time range");
  }

  await db.insert(sessions).values({
    title,
    type: str(fd.get("type")) || "Training",
    level: str(fd.get("level")) || "All levels",
    instructor: str(fd.get("instructor")) || null,
    startTime,
    endTime,
    capacity: Math.max(1, Number(fd.get("capacity")) || 8),
    description: str(fd.get("description")) || null,
  });
  refresh();
}

export async function removeSession(id: string) {
  await db.delete(sessions).where(eq(sessions.id, id));
  refresh();
}

export async function bookMember(sessionId: string, memberId: string) {
  // Capacity check → waitlist
  const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (session.length === 0) throw new Error("Session not found");

  const existing = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.sessionId, sessionId)));
  if (existing.some((b) => b.memberId === memberId)) return; // already booked
  const confirmed = existing.filter((b) => b.status === "confirmed").length;
  const status = confirmed >= session[0].capacity ? "waitlist" : "confirmed";

  await db.insert(bookings).values({ sessionId, memberId, status });
  refresh();
}

export async function cancelBooking(bookingId: string) {
  await db.delete(bookings).where(eq(bookings.id, bookingId));
  refresh();
}

export async function promoteBooking(bookingId: string) {
  await db.update(bookings).set({ status: "confirmed" }).where(eq(bookings.id, bookingId));
  refresh();
}

/* ------------------------------------------------------------------ */
/*  Safety board — sign out / in                                       */
/* ------------------------------------------------------------------ */

export async function signOut(fd: FormData) {
  const boatId = str(fd.get("boatId"));
  const helmName = str(fd.get("helmName"));
  if (!boatId || !helmName) throw new Error("Boat and helm are required");

  // Guard: boat must exist, be available, and not already on the water
  const [boat] = await db.select().from(boats).where(eq(boats.id, boatId)).limit(1);
  if (!boat) throw new Error("Boat not found");
  if (boat.status === "maintenance") throw new Error("Boat is in maintenance");
  const active = await db
    .select()
    .from(sorties)
    .where(and(eq(sorties.boatId, boatId), isNull(sorties.signedInAt)))
    .limit(1);
  if (active.length > 0) throw new Error("Boat is already on the water");

  await db.insert(sorties).values({
    boatId,
    helmName,
    memberId: str(fd.get("memberId")) || null,
    crewCount: Math.max(1, Number(fd.get("crewCount")) || 1),
    purpose: str(fd.get("purpose")) || "Free sail",
    area: str(fd.get("area")) || null,
    notes: str(fd.get("notes")) || null,
  });
  refresh();
}

export async function signIn(sortieId: string) {
  await db
    .update(sorties)
    .set({ signedInAt: new Date() })
    .where(and(eq(sorties.id, sortieId), isNull(sorties.signedInAt)));
  refresh();
}

export async function signInAll() {
  await db
    .update(sorties)
    .set({ signedInAt: new Date() })
    .where(isNull(sorties.signedInAt));
  refresh();
}

/* ------------------------------------------------------------------ */
/*  Maintenance issues                                                 */
/* ------------------------------------------------------------------ */

export async function addIssue(fd: FormData) {
  const boatId = str(fd.get("boatId"));
  const title = str(fd.get("title"));
  if (!boatId || !title) throw new Error("Boat and title are required");
  await db.insert(issues).values({
    boatId,
    title,
    details: str(fd.get("details")) || null,
    severity: str(fd.get("severity")) || "Medium",
    reportedBy: str(fd.get("reportedBy")) || null,
    status: "open",
  });
  refresh();
}

export async function setIssueStatus(id: string, status: "open" | "in_progress" | "resolved") {
  await db
    .update(issues)
    .set({ status, resolvedAt: status === "resolved" ? new Date() : null })
    .where(eq(issues.id, id));
  refresh();
}
