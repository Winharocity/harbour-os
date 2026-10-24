"use server";

import { db } from "@/db";
import { boats, bookings, issues, members, sessions, sorties } from "@/db/schema";
import { revalidatePath } from "next/cache";

/**
 * Seeds a realistic demo dataset — only when the database is empty.
 */
export async function seedDemo(): Promise<{ seeded: boolean }> {
  const existing = await db.select().from(members).limit(1);
  const existingBoats = await db.select().from(boats).limit(1);
  if (existing.length > 0 || existingBoats.length > 0) return { seeded: false };

  const memberRows = await db
    .insert(members)
    .values([
      { name: "Marta Ellison", email: "marta@crewmail.co", phone: "07700 900312", qualification: "RYA Dinghy Instructor", membershipType: "Instructor", emergencyContact: "Tom Ellison · 07700 900313" },
      { name: "Jonah Beckett", email: "jonah@crewmail.co", phone: "07700 900421", qualification: "RYA Senior Instructor", membershipType: "Instructor", emergencyContact: "Priya Beckett · 07700 900422" },
      { name: "Freya Lindqvist", email: "freya@sailmail.co", phone: "07700 900580", qualification: "RYA Level 3", membershipType: "Adult" },
      { name: "Oscar Whitfield", email: "oscar.w@sailmail.co", phone: "07700 900614", qualification: "RYA Level 2", membershipType: "Adult", emergencyContact: "M. Whitfield · 07700 900615" },
      { name: "Isla Carrick", email: "isla@sailmail.co", phone: "07700 900702", qualification: "RYA Level 1", membershipType: "Junior", emergencyContact: "R. Carrick · 07700 900703" },
      { name: "Noah Tennant", email: "noah.t@sailmail.co", phone: "07700 900817", qualification: "RYA Level 2", membershipType: "Junior", emergencyContact: "S. Tennant · 07700 900818" },
      { name: "Amara Dufort", email: "amara@sailmail.co", phone: "07700 900901", qualification: "RYA Level 4", membershipType: "Adult" },
      { name: "Rhys Calloway", email: "rhys@sailmail.co", phone: "07700 900944", qualification: "None", membershipType: "Day sailor" },
      { name: "Petra Solberg", email: "petra@sailmail.co", phone: "07700 901003", qualification: "RYA Level 3", membershipType: "Adult" },
      { name: "Leo Marchetti", email: "leo.m@sailmail.co", phone: "07700 901077", qualification: "RYA Level 2", membershipType: "Family", emergencyContact: "E. Marchetti · 07700 901078" },
    ])
    .returning();

  const boatRows = await db
    .insert(boats)
    .values([
      { name: "Zephyr", className: "RS Feva", type: "Dinghy", sailNumber: "5812", capacity: 2, notes: "New jib fitted March" },
      { name: "Mistral", className: "RS Feva", type: "Dinghy", sailNumber: "5914", capacity: 2 },
      { name: "Scirocco", className: "Laser / ILCA 6", type: "Dinghy", sailNumber: "204113", capacity: 1 },
      { name: "Alizee", className: "Laser / ILCA 7", type: "Dinghy", sailNumber: "198822", capacity: 1, notes: "Rudder stock slightly loose" },
      { name: "Plover", className: "Wayfarer", type: "Dinghy", sailNumber: "W10112", capacity: 4 },
      { name: "Curlew", className: "Wayfarer", type: "Dinghy", sailNumber: "W10298", capacity: 4 },
      { name: "Skylark", className: "RS Vision", type: "Dinghy", sailNumber: "1322", capacity: 3 },
      { name: "Kittiwake", className: "Hansa 303", type: "Accessible", sailNumber: "3307", capacity: 2, notes: "Sailability boat — hoists available" },
      { name: "Harbour One", className: "Highfield 460 RIB", type: "Safety boat", sailNumber: null, capacity: 5, notes: "VHF channel 72 · kill cord mandatory" },
      { name: "Harbour Two", className: "Highfield 420 RIB", type: "Safety boat", sailNumber: null, capacity: 4 },
      { name: "Dragonfly", className: "RS 200", type: "Dinghy", sailNumber: "1428", capacity: 2, status: "maintenance", notes: "Centreboard gasket replacement in progress" },
      { name: "Bumblebee", className: "Optimist", type: "Dinghy", sailNumber: "GBR6142", capacity: 1 },
    ])
    .returning();

  const now = new Date();
  const today = new Date(now);
  const inDays = (d: number, h: number, m = 0) => {
    const t = new Date(today);
    t.setDate(t.getDate() + d);
    t.setHours(h, m, 0, 0);
    return t;
  };

  const sessionRows = await db
    .insert(sessions)
    .values([
      { title: "RYA Level 2 — Day 1", type: "Course", level: "Beginner", instructor: "Jonah Beckett", startTime: inDays(0, 9, 30), endTime: inDays(0, 16, 0), capacity: 6, description: "Rigging, launching, tacking & gybing fundamentals." },
      { title: "Junior Race Squad", type: "Training", level: "Advanced", instructor: "Marta Ellison", startTime: inDays(0, 10, 0), endTime: inDays(0, 12, 30), capacity: 8, description: "Starts, mark rounding and upwind tactics." },
      { title: "Evening Social Sail", type: "Club", level: "All levels", instructor: null, startTime: inDays(0, 18, 0), endTime: inDays(0, 20, 30), capacity: 14, description: "Casual cruising, bring your own crew or pair up on the slipway." },
      { title: "RYA Level 2 — Day 2", type: "Course", level: "Beginner", instructor: "Jonah Beckett", startTime: inDays(1, 9, 30), endTime: inDays(1, 16, 0), capacity: 6, description: "Coming alongside, reefing afloat, capsize recovery." },
      { title: "Women on Water", type: "Club", level: "Improver", instructor: "Marta Ellison", startTime: inDays(3, 10, 0), endTime: inDays(3, 12, 30), capacity: 10 },
      { title: "Club Racing — Series 4 R3", type: "Racing", level: "Advanced", instructor: null, startTime: inDays(5, 14, 0), endTime: inDays(5, 17, 0), capacity: 20, description: "Handicap fleet, average lap scoring. Briefing 13:15." },
      { title: "Improver Skills Clinic", type: "Training", level: "Improver", instructor: "Jonah Beckett", startTime: inDays(6, 10, 0), endTime: inDays(6, 13, 0), capacity: 8, description: "Sail controls, balance and efficient upwind trim." },
    ])
    .returning();

  const m = (i: number) => memberRows[i].id;
  await db.insert(bookings).values([
    { sessionId: sessionRows[0].id, memberId: m(4) },
    { sessionId: sessionRows[0].id, memberId: m(7) },
    { sessionId: sessionRows[0].id, memberId: m(9) },
    { sessionId: sessionRows[1].id, memberId: m(2) },
    { sessionId: sessionRows[1].id, memberId: m(5) },
    { sessionId: sessionRows[1].id, memberId: m(6) },
    { sessionId: sessionRows[2].id, memberId: m(2) },
    { sessionId: sessionRows[2].id, memberId: m(3) },
    { sessionId: sessionRows[2].id, memberId: m(6) },
    { sessionId: sessionRows[2].id, memberId: m(8) },
    { sessionId: sessionRows[3].id, memberId: m(4) },
    { sessionId: sessionRows[3].id, memberId: m(7) },
    { sessionId: sessionRows[3].id, memberId: m(9) },
    { sessionId: sessionRows[4].id, memberId: m(2) },
    { sessionId: sessionRows[4].id, memberId: m(8) },
    { sessionId: sessionRows[6].id, memberId: m(3) },
    { sessionId: sessionRows[6].id, memberId: m(6) },
  ]);

  const agoH = (h: number, mins = 0) => new Date(now.getTime() - (h * 60 + mins) * 60_000);
  await db.insert(sorties).values([
    { boatId: boatRows[2].id, helmName: "Freya Lindqvist", memberId: m(2), crewCount: 1, purpose: "Free sail", area: "Harbour — north of pier", signedOutAt: agoH(0, 42) },
    { boatId: boatRows[1].id, helmName: "Oscar Whitfield", memberId: m(3), crewCount: 2, purpose: "Free sail", area: "Bay leg", signedOutAt: agoH(1, 24) },
    { boatId: boatRows[8].id, helmName: "Marta Ellison", memberId: m(0), crewCount: 2, purpose: "Safety duty", area: "Race area A", signedOutAt: agoH(1, 58) },
    { boatId: boatRows[4].id, helmName: "Petra Solberg", memberId: m(8), crewCount: 3, purpose: "Lesson", area: "Training area B", signedOutAt: agoH(2, 47) },
    { boatId: boatRows[0].id, helmName: "Isla Carrick", memberId: m(4), crewCount: 2, purpose: "Free sail", signedOutAt: agoH(3, 12), signedInAt: agoH(0, 55) },
    { boatId: boatRows[5].id, helmName: "Alan Pritchard", crewCount: 4, purpose: "Free sail", signedOutAt: agoH(26, 10), signedInAt: agoH(24, 30) },
    { boatId: boatRows[7].id, helmName: "Leo Marchetti", memberId: m(9), crewCount: 2, purpose: "Lesson", area: "Pontoons", signedOutAt: agoH(25, 0), signedInAt: agoH(23, 45) },
  ]);

  await db.insert(issues).values([
    { boatId: boatRows[10].id, title: "Centreboard gasket torn", details: "Water ingress at pivot. New gasket ordered, arriving Thursday.", severity: "High", status: "in_progress", reportedBy: "Marta Ellison" },
    { boatId: boatRows[3].id, title: "Rudder stock works loose", details: "Tighten pivot bolt before each session; watch for play.", severity: "Medium", status: "open", reportedBy: "Jonah Beckett" },
    { boatId: boatRows[8].id, title: "VHF handheld — replace battery", severity: "Urgent", status: "open", reportedBy: "Marta Ellison" },
    { boatId: boatRows[6].id, title: "Mainsail telltales missing", details: "Three on port side. Spares in the office drawer.", severity: "Low", status: "resolved", reportedBy: "Oscar Whitfield", resolvedAt: agoH(30) },
  ]);

  revalidatePath("/");
  revalidatePath("/water");
  revalidatePath("/schedule");
  revalidatePath("/fleet");
  revalidatePath("/members");
  return { seeded: true };
}
