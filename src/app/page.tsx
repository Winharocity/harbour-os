import { AutoRefresh, ElapsedClock } from "@/components/elapsed";
import { Reveal } from "@/components/reveal";
import { SeedButton } from "@/components/seed-button";
import { SignInButton } from "@/components/board-actions";
import { SignOutDialog } from "@/components/sign-out-dialog";
import { Avatar, Button, Pill } from "@/components/ui";
import { WeatherPanel } from "@/components/weather-panel";
import { getActiveSorties, getFleet, getMembers, getSessions, getSummary } from "@/lib/queries";
import { getWeather } from "@/lib/weather";
import { fmtLongDay, fmtTime, isSameDay } from "@/lib/utils";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  CloudOff,
  Radar,
  Sailboat,
  TriangleAlert,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function greeting(hour: number) {
  if (hour < 6) return "Night watch";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function StatTile({ icon: Icon, label, value, sub, accent }: {
  icon: typeof Sailboat;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="card px-5 py-4.5 relative overflow-hidden">
      <div className={`absolute top-0 left-5 right-5 h-0.5 rounded-b ${accent}`} />
      <div className="flex items-center justify-between">
        <p className="label-mono text-ink/45">{label}</p>
        <Icon className="size-4 text-ink/25" />
      </div>
      <p className="mt-2 font-mono text-3xl font-bold tabular tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-ink/50">{sub}</p>
    </div>
  );
}

export default async function OverviewPage() {
  const now = new Date();
  const [summary, weather, sorties, sessions, fleet, members] = await Promise.all([
    getSummary(),
    getWeather(),
    getActiveSorties(),
    getSessions(),
    getFleet(),
    getMembers(),
  ]);
  const centre = process.env.CENTRE_NAME ?? "Harbour Sailing Centre";

  const todays = sessions.filter((s) => isSameDay(s.startTime, now)).slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <AutoRefresh seconds={60} />

      {/* ------------- hero ------------- */}
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
          <div>
            <p className="label-mono text-sea mb-2">{fmtLongDay(now)} · {centre}</p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-[0.95]">
              {greeting(now.getHours())},
              <br />
              <span className="text-ink/55">skipper.</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SignOutDialog boats={fleet} members={members} />
            <Link href="/schedule">
              <Button variant="outline"><CalendarDays className="size-4" /> New session</Button>
            </Link>
          </div>
        </div>
      </Reveal>

      {summary.isEmpty ? (
        <Reveal delay={0.08}>
          <div className="card p-8 sm:p-12 text-center mb-8">
            <p className="label-mono text-signal mb-3">Fresh install detected</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter max-w-xl mx-auto leading-tight">
              Your centre's ops hub is live — the harbour is quiet.
            </h2>
            <p className="text-ink/55 mt-3 max-w-md mx-auto text-sm">
              Seed a realistic demo (boats, members, sessions, live sign-outs) to explore, or start adding your own fleet and sailors.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <SeedButton />
              <Link href="/fleet"><Button variant="outline"><Sailboat className="size-4" /> Add your first boat</Button></Link>
              <Link href="/members"><Button variant="outline"><Users className="size-4" /> Add a member</Button></Link>
            </div>
          </div>
        </Reveal>
      ) : (
        <Reveal delay={0.06}>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5 mb-6">
            <StatTile icon={Radar} label="On the water" value={String(summary.onWaterCount)} sub={`${summary.peopleOnWater} people afloat`} accent="bg-tide" />
            <StatTile icon={Sailboat} label="Boats ready" value={`${summary.availableCount}/${summary.boatCount}`} sub={`${summary.onWaterCount} afloat · ${summary.maintenanceCount} in maintenance`} accent="bg-sea" />
            <StatTile icon={CalendarDays} label="Next 7 days" value={String(summary.weekSessionCount)} sub="scheduled sessions" accent="bg-sun" />
            <StatTile icon={TriangleAlert} label="Open issues" value={String(summary.openIssueCount)} sub={`${summary.memberCount} members on record`} accent="bg-signal" />
          </div>
        </Reveal>
      )}

      {/* ------------- main grid ------------- */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        <Reveal delay={0.12} className="lg:col-span-2">
          {weather ? (
            <WeatherPanel report={weather} />
          ) : (
            <div className="card-dark text-salt p-8 h-full flex flex-col items-center justify-center text-center">
              <CloudOff className="size-8 text-salt/30 mb-3" />
              <p className="font-bold">Weather feed unavailable</p>
              <p className="text-sm text-salt/50 mt-1 max-w-xs">
                Could not reach open-meteo.com. Check the server's internet connection and CENTRE_LAT / CENTRE_LON settings.
              </p>
            </div>
          )}
        </Reveal>

        {/* afloat now */}
        <Reveal delay={0.18}>
          <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line/70">
              <div className="flex items-center gap-2">
                <span className={`pulse-soft size-2 rounded-full ${sorties.length ? "bg-tide" : "bg-line"}`} />
                <p className="label-mono text-ink/50">Afloat now</p>
              </div>
              <Link href="/water" className="text-xs font-semibold text-sea hover:underline inline-flex items-center gap-0.5">
                Safety board <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            {sorties.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center px-6">
                <Radar className="size-7 text-ink/20 mb-2.5" />
                <p className="font-bold text-sm text-ink/70">Nobody is on the water</p>
                <p className="text-xs text-ink/45 mt-1">Signed-out boats will appear here in real time.</p>
              </div>
            ) : (
              <ul className="divide-y divide-line/60 flex-1">
                {sorties.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={s.helmName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{s.boatName}</p>
                      <p className="text-xs text-ink/50 truncate">{s.helmName} · crew {s.crewCount}</p>
                    </div>
                    <ElapsedClock since={s.signedOutAt.toISOString()} className="font-mono text-xs font-semibold tabular text-ink/70" />
                  </li>
                ))}
              </ul>
            )}
            <div className="px-5 py-3 border-t border-line/70">
              <SignOutDialog
                boats={fleet}
                members={members}
                trigger={
                  <button className="cursor-pointer w-full text-left text-xs font-semibold text-ink/60 hover:text-ink inline-flex items-center gap-1.5 transition-colors">
                    <Sailboat className="size-3.5 text-signal" /> Sign another boat out <ArrowRight className="size-3 ml-auto" />
                  </button>
                }
              />
            </div>
          </div>
        </Reveal>

        {/* today */}
        <Reveal delay={0.24} className="lg:col-span-2">
          <div className="card h-full">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line/70">
              <p className="label-mono text-ink/50">On today</p>
              <Link href="/schedule" className="text-xs font-semibold text-sea hover:underline inline-flex items-center gap-0.5">
                Full schedule <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            {todays.length === 0 ? (
              <div className="py-10 text-center px-6">
                <Clock3 className="size-7 text-ink/20 mx-auto mb-2.5" />
                <p className="font-bold text-sm text-ink/70">No sessions today</p>
                <p className="text-xs text-ink/45 mt-1">Courses, club sails and racing will show here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-line/60">
                {todays.map((s) => {
                  const full = s.confirmedCount >= s.capacity;
                  return (
                    <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5">
                      <p className="font-mono text-sm font-bold tabular w-28 shrink-0">
                        {fmtTime(s.startTime)}<span className="text-ink/35 font-normal">–{fmtTime(s.endTime)}</span>
                      </p>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">{s.title}</p>
                        <p className="text-xs text-ink/50 truncate">{s.instructor ? `${s.instructor} · ` : ""}{s.level}</p>
                      </div>
                      <Pill tone={s.type === "Racing" ? "signal" : s.type === "Course" ? "sea" : "foam"}>{s.type}</Pill>
                      <p className={`font-mono text-xs font-bold tabular ${full ? "text-signal-dark" : "text-ink/60"}`}>
                        {s.confirmedCount}/{s.capacity}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Reveal>

        {/* fleet snapshot */}
        <Reveal delay={0.3}>
          <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line/70">
              <p className="label-mono text-ink/50">Fleet status</p>
              <Link href="/fleet" className="text-xs font-semibold text-sea hover:underline inline-flex items-center gap-0.5">
                Fleet <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            <div className="px-5 py-4 flex-1 flex flex-col justify-center gap-3">
              {summary.boatCount === 0 ? (
                <p className="text-sm text-ink/50 text-center py-4">Add boats to see the fleet at a glance.</p>
              ) : (
                <>
                  <div className="flex h-3.5 rounded-full overflow-hidden bg-foam-2">
                    {summary.availableCount > 0 && <div className="bg-sea" style={{ width: `${(summary.availableCount / summary.boatCount) * 100}%` }} />}
                    {summary.onWaterCount > 0 && <div className="bg-sun" style={{ width: `${(summary.onWaterCount / summary.boatCount) * 100}%` }} />}
                    {summary.maintenanceCount > 0 && <div className="bg-signal" style={{ width: `${(summary.maintenanceCount / summary.boatCount) * 100}%` }} />}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { n: summary.availableCount, l: "Ready", c: "text-sea" },
                      { n: summary.onWaterCount, l: "Afloat", c: "text-[#8a6413]" },
                      { n: summary.maintenanceCount, l: "In dock", c: "text-signal-dark" },
                    ].map((x) => (
                      <div key={x.l} className="rounded-lg bg-foam/70 border border-line/60 py-2.5">
                        <p className={`font-mono text-xl font-bold tabular ${x.c}`}>{x.n}</p>
                        <p className="label-mono text-ink/40 mt-0.5">{x.l}</p>
                      </div>
                    ))}
                  </div>
                  {summary.openIssueCount > 0 && (
                    <Link href="/fleet#maintenance" className="inline-flex items-center gap-1.5 text-xs font-semibold text-signal-dark hover:underline">
                      <Wrench className="size-3.5" /> {summary.openIssueCount} open maintenance issue{summary.openIssueCount === 1 ? "" : "s"}
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
