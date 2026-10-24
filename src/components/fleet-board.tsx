"use client";

import { addBoat, addIssue, removeBoat, setBoatStatus, setIssueStatus } from "@/lib/actions";
import type { BoatView, IssueRow } from "@/lib/queries";
import { fmtDay, fmtTime } from "@/lib/utils";
import { Button, Dialog, EmptyState, Field, Input, Pill, Select, Textarea } from "@/components/ui";
import {
  Anchor,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Hash,
  Plus,
  Sailboat,
  Trash2,
  TriangleAlert,
  Users,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const TYPES = ["Dinghy", "Keelboat", "Accessible", "Safety boat", "Paddle", "Windsurf"];
const SEVERITIES = ["Low", "Medium", "High", "Urgent"];

function sevTone(s: string): "sea" | "sun" | "signal" | "ink" {
  if (s === "Urgent" || s === "High") return "signal";
  if (s === "Medium") return "sun";
  return "ink";
}

export function FleetBoard({ fleet, issues }: { fleet: BoatView[]; issues: (IssueRow & { boatName: string })[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [issueFor, setIssueFor] = useState<BoatView | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const openIssues = issues.filter((i) => i.status !== "resolved");
  const resolved = issues.filter((i) => i.status === "resolved");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <p className="label-mono text-sea mb-2">{fleet.length} hull{fleet.length === 1 ? "" : "s"} on record</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none">Fleet</h1>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="size-4" /> Add boat</Button>
      </div>

      {fleet.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Sailboat className="size-7" />}
            title="No boats yet"
            body="Add your first dinghy or safety boat, then track its status and maintenance here."
            action={<Button onClick={() => setAddOpen(true)}><Plus className="size-4" /> Add boat</Button>}
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {fleet.map((b) => (
            <article key={b.id} className="card p-5 flex flex-col relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 ${b.onWater ? "bg-sun" : b.status === "maintenance" ? "bg-signal" : "bg-sea"}`} />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-xl font-black tracking-tight truncate">{b.name}</h3>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/45 mt-0.5">{b.className}</p>
                </div>
                {b.onWater ? (
                  <Pill tone="sun"><Sailboat className="size-3" /> Afloat</Pill>
                ) : b.status === "maintenance" ? (
                  <Pill tone="signal"><Wrench className="size-3" /> In dock</Pill>
                ) : (
                  <Pill tone="sea"><CheckCircle2 className="size-3" /> Ready</Pill>
                )}
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/55">
                {b.sailNumber && <span className="inline-flex items-center gap-1 font-mono tabular"><Hash className="size-3 text-ink/30" /> {b.sailNumber}</span>}
                <span className="inline-flex items-center gap-1"><Users className="size-3 text-ink/30" /> seats {b.capacity}</span>
                <span className="inline-flex items-center gap-1"><Anchor className="size-3 text-ink/30" /> {b.type}</span>
              </div>

              {b.notes && <p className="mt-2.5 text-[13px] text-ink/55 italic">“{b.notes}”</p>}

              {b.openIssues > 0 && (
                <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-signal-dark">
                  <TriangleAlert className="size-3.5" /> {b.openIssues} open issue{b.openIssues === 1 ? "" : "s"}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-dashed border-line flex items-center gap-2">
                {b.status === "available" ? (
                  <Button size="sm" variant="danger" disabled={b.onWater || pending} title={b.onWater ? "Boat is afloat" : undefined}
                    onClick={() => startTransition(async () => { await setBoatStatus(b.id, "maintenance"); router.refresh(); })}>
                    <Wrench className="size-3.5" /> To dock
                  </Button>
                ) : (
                  <Button size="sm" variant="sea" disabled={pending}
                    onClick={() => startTransition(async () => { await setBoatStatus(b.id, "available"); router.refresh(); })}>
                    <CheckCircle2 className="size-3.5" /> Return to service
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setIssueFor(b)}>
                  <TriangleAlert className="size-3.5" /> Log issue
                </Button>
                <button
                  title="Delete boat"
                  className="cursor-pointer ml-auto rounded-md p-1.5 text-ink/20 hover:text-signal hover:bg-signal/8 transition-colors"
                  onClick={() => {
                    if (confirm(`Delete ${b.name}? Its sorties and issues will also be removed.`)) {
                      startTransition(async () => { await removeBoat(b.id); router.refresh(); });
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ------------- maintenance log ------------- */}
      <div id="maintenance" className="mt-9 scroll-mt-6">
        <div className="flex items-center gap-3 mb-3.5">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-ink/50">Maintenance log</h2>
          <span className="h-px flex-1 bg-line" />
          <span className="font-mono text-[11px] text-ink/35">{openIssues.length} open</span>
        </div>

        {issues.length === 0 ? (
          <div className="card">
            <EmptyState icon={<Wrench className="size-7" />} title="No issues logged" body="A tidy shed. Log damage or faults from any boat card." />
          </div>
        ) : (
          <div className="card divide-y divide-line/60">
            {issues.map((i) => (
              <div key={i.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 ${i.status === "resolved" ? "opacity-50" : ""}`}>
                <Pill tone={sevTone(i.severity)}>{i.severity}</Pill>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">
                    {i.title} <span className="font-normal text-ink/45">· {i.boatName}</span>
                  </p>
                  {i.details && <p className="text-xs text-ink/50 truncate mt-0.5">{i.details}</p>}
                </div>
                <p className="font-mono text-[11px] tabular text-ink/45 hidden sm:block">
                  {fmtDay(i.createdAt)} {fmtTime(i.createdAt)}{i.reportedBy ? ` · ${i.reportedBy}` : ""}
                </p>
                <div className="flex items-center gap-1.5">
                  {i.status === "open" && (
                    <Button size="xs" variant="outline" disabled={pending}
                      onClick={() => startTransition(async () => { await setIssueStatus(i.id, "in_progress"); router.refresh(); })}>
                      <CircleDot className="size-3" /> Start
                    </Button>
                  )}
                  {i.status !== "resolved" ? (
                    <Button size="xs" variant="sea" disabled={pending}
                      onClick={() => startTransition(async () => { await setIssueStatus(i.id, "resolved"); router.refresh(); })}>
                      <CheckCircle2 className="size-3" /> Resolve
                    </Button>
                  ) : (
                    <Button size="xs" variant="ghost" disabled={pending}
                      onClick={() => startTransition(async () => { await setIssueStatus(i.id, "open"); router.refresh(); })}>
                      Reopen <ArrowRight className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {resolved.length > 0 && openIssues.length > 0 && null}
          </div>
        )}
      </div>

      {/* --- add boat dialog --- */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add a boat" eyebrow="Fleet register">
        <form
          action={(fd) => startTransition(async () => { await addBoat(fd); setAddOpen(false); router.refresh(); })}
          className="grid grid-cols-2 gap-4 mt-4"
        >
          <Field label="Boat name" className="col-span-2"><Input name="name" required placeholder="e.g. Zephyr" /></Field>
          <Field label="Class / model"><Input name="className" placeholder="e.g. RS Feva" /></Field>
          <Field label="Type"><Select name="type" defaultValue="Dinghy">{TYPES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
          <Field label="Sail / hull number"><Input name="sailNumber" placeholder="Optional" /></Field>
          <Field label="Capacity"><Input name="capacity" type="number" min={1} defaultValue={2} /></Field>
          <Field label="Notes" className="col-span-2"><Textarea name="notes" placeholder="Quirks, rigging notes…" /></Field>
          <div className="col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add boat"}</Button>
          </div>
        </form>
      </Dialog>

      {/* --- log issue dialog --- */}
      <Dialog open={!!issueFor} onClose={() => setIssueFor(null)} title={issueFor ? `Log issue — ${issueFor.name}` : ""} eyebrow="Maintenance">
        {issueFor && (
          <form
            action={(fd) => startTransition(async () => { await addIssue(fd); setIssueFor(null); router.refresh(); })}
            className="space-y-4 mt-4"
          >
            <input type="hidden" name="boatId" value={issueFor.id} />
            <Field label="What's wrong?"><Input name="title" required placeholder="e.g. Centreboard gasket torn" /></Field>
            <Field label="Details"><Textarea name="details" placeholder="Where, how bad, temporary fix…" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Severity">
                <Select name="severity" defaultValue="Medium">{SEVERITIES.map((s) => <option key={s}>{s}</option>)}</Select>
              </Field>
              <Field label="Reported by"><Input name="reportedBy" placeholder="Your name" /></Field>
            </div>
            {issueFor.status === "available" && (
              <p className="text-xs text-ink/50">
                Tip: if the boat shouldn't sail until fixed, also press “To dock” on its card.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIssueFor(null)}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Logging…" : "Log issue"}</Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
