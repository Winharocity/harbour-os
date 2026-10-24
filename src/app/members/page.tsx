import { MembersBoard } from "@/components/members-board";
import { Reveal } from "@/components/reveal";
import { getMembers } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Members" };
export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const members = await getMembers();
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <Reveal>
        <MembersBoard members={members} />
      </Reveal>
    </div>
  );
}
