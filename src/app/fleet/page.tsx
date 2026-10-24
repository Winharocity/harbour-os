import { FleetBoard } from "@/components/fleet-board";
import { Reveal } from "@/components/reveal";
import { getFleet, getIssues } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Fleet" };
export const dynamic = "force-dynamic";

export default async function FleetPage() {
  const [fleet, issues] = await Promise.all([getFleet(), getIssues()]);
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <Reveal>
        <FleetBoard fleet={fleet} issues={issues} />
      </Reveal>
    </div>
  );
}
