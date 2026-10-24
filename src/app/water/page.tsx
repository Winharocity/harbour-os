import { AutoRefresh, ElapsedClock } from "@/components/elapsed";
import { Reveal } from "@/components/reveal";
import { SignInAllButton, SignInButton } from "@/components/board-actions";
import { SignOutDialog } from "@/components/sign-out-dialog";
import { Avatar, EmptyState, Pill } from "@/components/ui";
import { getActiveSorties, getFleet, getMembers, getRecentSorties } from "@/lib/queries";
import { fmtElapsed, fmtTime, isSameDay } from "@/lib/utils";
import type { Metadata } from "next";
import { Clock3, MapPin, Navigation, Radar, Sailboat, Users } from "lucide-react";

export const metadata: Metadata = { title: "On the Water" };
export const dynamic = "force-dynamic";

export default async function WaterPage() {
  const [active, history, fleet, members] = await Promise.all([
    getActiveSorties(),
    getRecentSorties(10),
    getFleet(),
    getMembers(),
  ]);

  const people = active.reduce((a, s) => a + s.crewCount, 0);
  const todayBack = history.filter((s) => s.signedInAt && isSameDay(s.signedInAt, new Date()));

  return (
    <div>
      <AutoRefresh seconds={30} />

      {/* ------- dark live header ------- */}
      <div className="bg-ink text-salt border-b border-line-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="label-mono text-salt/45 mb-2 flex items-center gap-2">
                <span className={`pulse-soft inline-block size-2 rounded-full ${active.length ? "bg-tide" : "bg-salt/30"}`} />
                Safety board · live
              </p>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tighter leading-none">
                {active.length === 0 ? "All clear." : (
                  <>
                    {active.length} boat{active.length === 1 ? "" : "s"}
                    <span className="text-salt/40"> · </span>
                    {people} <span className="text-salt/40">afloat</span>
                  </>
                )}
              </h1>
              <p className="mt-3 text-sm text-salt/50 max-w-md">
                Every signed-out boat below is accounted for. Sign boats back in the moment they touch the slipway.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SignOutDialog boats={fleet} members={members} />
              <SignInAllButton count={active.length} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-7">
        {/* ------- active sorties ------- */}
        {active.length === 0 ? (
          <Reveal>
            <div className="card">
              <EmptyState
                icon={<Radar className="size-7" />}
                title="Nobody is afloat right now"
                body="Use “Sign out a boat” when the first helm or crew leaves the slipway — the board ticks live from that moment."
                action={<SignOutDialog boats={fleet} members={members} />}
              />
            </div>
          </Reveal>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {active.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.05}>
                <div className="card p-5 relative overflow-hidden h-full">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-tide to-sea" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-2xl font-black tracking-tight truncate">{s.boatName}</p>
                      <p className="font-mono text-[11px] text-ink/45 uppercase tracking-[0.14em] mt-0.5">{s.boatClass} · {s.boatType}</p>
                    </div>
                    <Pill tone="sky"><Navigation className="size-3" />{s.purpose}</Pill>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <Avatar name={s.helmName} />
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{s.helmName}</p>
                      <p className="text-xs text-ink/50 flex items-center gap-1"><Users className="size-3" /> {s.crewCount} aboard</p>
                    </div>
                  </div>

                  {s.area && (
                    <p className="mt-3 text-xs text-ink/55 inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-sea" /> {s.area}</p>
                  )}

                  <div className="mt-4 pt-4 border-t border-dashed border-line flex items-end justify-between gap-3">
                    <div>
                      <p className="label-mono text-ink/40 mb-1">Time out</p>
                      <ElapsedClock since={s.signedOutAt.toISOString()} className="font-mono text-2xl font-bold tabular tracking-tight" />
                      <p className="text-[11px] text-ink/45 mt-1 flex items-center gap-1"><Clock3 className="size-3" /> out at {fmtTime(s.signedOutAt)}</p>
                    </div>
                    <SignInButton sortieId={s.id} size="md" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {/* ------- back on shore ------- */}
        <Reveal delay={0.15}>
          <div className="card mt-7">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line/70">
              <p className="label-mono text-ink/50">Back on shore</p>
              <p className="font-mono text-[11px] text-ink/40 uppercase tracking-[0.14em]">{todayBack.length} today</p>
            </div>
            {history.length === 0 ? (
              <p className="px-5 py-8 text-sm text-ink/45 text-center">Completed sorties will be logged here.</p>
            ) : (
              <ul className="divide-y divide-line/60">
                {history.map((s) => {
                  const dur = s.signedInAt ? new Date(s.signedInAt).getTime() - new Date(s.signedOutAt).getTime() : 0;
                  const today = s.signedInAt ? isSameDay(s.signedInAt, new Date()) : false;
                  return (
                    <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
                      <Avatar name={s.helmName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate">{s.boatName} <span className="font-normal text-ink/45">· {s.helmName}</span></p>
                        <p className="text-xs text-ink/45 truncate">{s.purpose}{s.area ? ` · ${s.area}` : ""}</p>
                      </div>
                      <p className="font-mono text-xs tabular text-ink/55">
                        {fmtTime(s.signedOutAt)} → {s.signedInAt ? fmtTime(s.signedInAt) : "—"}
                        <span className="text-ink/35"> ({fmtElapsed(dur)})</span>
                      </p>
                      <Pill tone="foam">{today ? "Today" : "Earlier"}</Pill>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
