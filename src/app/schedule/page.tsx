import { Reveal } from "@/components/reveal";
import { ScheduleBoard } from "@/components/schedule-board";
import { getMembers, getSessions } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Schedule" };
export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const [sessions, members] = await Promise.all([getSessions(), getMembers()]);
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <Reveal>
        <ScheduleBoard sessions={sessions} members={members} />
      </Reveal>
    </div>
  );
}
