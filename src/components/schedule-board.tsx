"use client";

import { addSession, bookMember, cancelBooking, promoteBooking, removeSession } from "@/lib/actions";
import type { BookingView, SessionView } from "@/lib/queries";
import { dayKey, fmtLongDay, fmtTime, isSameDay } from "@/lib/utils";
import { Avatar, Button, Dialog, EmptyState, Field, Input, Pill, Select, Textarea } from "@/components/ui";
import { ArrowUpCircle, CalendarDays, CalendarPlus, Trash2, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const TYPES = ["Course", "Training", "Club", "Racing", "Rental"];
const LEVELS = ["All levels", "Beginner", "Improver", "Advanced", "Race squad"];

function typeTone(t: string): "sea" | "sun" | "signal" | "ink" | "sky" {
  if (t === "Course") return "sea";
  if (t === "Racing") return "signal";
  if (t === "Club") return "sun";
  if (t === "Training") return "sky";
  return "ink";
}

export function ScheduleBoard({ sessions, members }: { sessions: SessionView[]; members: { id: string; name: string }[] }) {
  const [newOpen, setNewOpen] = useState(false);
  const [bookFor, setBookFor] = useState<SessionView | null>(null);
  const [memberId, setMemberId] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const groups = useMemo(() => {
    const map = new Map<string, SessionView[]>();
    for (const s of sessions) {
      const k = dayKey(s.startTime);
      map.set(k, [...(map.get(k) ?? []), s]);
    }
    return [...map.entries()];
  }, [sessions]);

  function createSession(fd: FormData) {
    startTransition(async () => {
      await addSession(fd);
      setNewOpen(false);
      router.refresh();
    });
  }

  function doBook() {
    if (!bookFor || !memberId) return;
    startTransition(async () => {
      await bookMember(bookFor.id, memberId);
      setBookFor(null);
      setMemberId("");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <p className="label-mono text-sea mb-2">Courses · Training · Club sailing</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none">Schedule</h1>
        </div>
        <Button onClick={() => setNewOpen(true)}><CalendarPlus className="size-4" /> New session</Button>
      </div>

      {groups.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<CalendarDays className="size-7" />}
            title="Nothing scheduled yet"
            body="Create your first course, club sail or race — members can then be booked in."
            action={<Button onClick={() => setNewOpen(true)}><CalendarPlus className="size-4" /> New session</Button>}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([key, list]) => {
            const first = list[0].startTime;
            const today = isSameDay(first, new Date());
            return (
              <section key={key}>
                <div className="flex items-center gap-3 mb-3.5">
                  <h2 className={`font-mono text-xs font-bold uppercase tracking-[0.18em] ${today ? "text-signal" : "text-ink/50"}`}>
                    {today ? "Today" : fmtLongDay(first)}
                  </h2>
                  <span className="h-px flex-1 bg-line" />
                  <span className="font-mono text-[11px] text-ink/35">{list.length} session{list.length === 1 ? "" : "s"}</span>
                </div>
                <div className="grid lg:grid-cols-2 gap-4">
                  {list.map((s) => {
                    const full = s.confirmedCount >= s.capacity;
                    const pct = Math.min(100, (s.confirmedCount / s.capacity) * 100);
                    return (
                      <article key={s.id} className="card p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-mono text-sm font-bold tabular text-ink/70">
                              {fmtTime(s.startTime)} – {fmtTime(s.endTime)}
                            </p>
                            <h3 className="text-lg font-black tracking-tight mt-0.5 truncate">{s.title}</h3>
                            <p className="text-xs text-ink/50 mt-0.5">
                              {s.instructor ? <span className="font-semibold text-ink/65">{s.instructor}</span> : "Self-led"} · {s.level}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Pill tone={typeTone(s.type)}>{s.type}</Pill>
                            <button
                              title="Delete session"
                              className="cursor-pointer rounded-md p-1.5 text-ink/25 hover:text-signal hover:bg-signal/8 transition-colors"
                              onClick={() => {
                                if (confirm(`Delete “${s.title}” and its ${s.bookings.length} booking(s)?`)) {
                                  startTransition(async () => {
                                    await removeSession(s.id);
                                    router.refresh();
                                  });
                                }
                              }}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>

                        {s.description && <p className="text-[13px] text-ink/60 mt-2.5">{s.description}</p>}

                        {/* capacity */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="label-mono text-ink/40">Booked</p>
                            <p className={`font-mono text-xs font-bold tabular ${full ? "text-signal-dark" : "text-ink/60"}`}>
                              {s.confirmedCount}/{s.capacity}{s.waitlistCount > 0 ? ` · ${s.waitlistCount} waitlist` : ""}
                            </p>
                          </div>
                          <div className="h-1.5 rounded-full bg-foam-2 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${full ? "bg-signal" : "bg-sea"}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        {/* bookings */}
                        <div className="mt-4 flex flex-wrap items-center gap-1.5">
                          {s.bookings.filter((b) => b.status === "confirmed").map((b) => (
                            <BookingChip key={b.id} b={b} onRemove={(id) => startTransition(async () => { await cancelBooking(id); router.refresh(); })} />
                          ))}
                          {s.bookings.filter((b) => b.status === "waitlist").map((b) => (
                            <span key={b.id} className="inline-flex items-center gap-1 rounded-full border border-dashed border-line bg-foam/60 pl-1 pr-1.5 py-0.5 text-[11px] font-semibold text-ink/55">
                              <Avatar name={b.memberName} size="sm" />
                              {b.memberName}
                              {!full && (
                                <button
                                  title="Move to confirmed"
                                  className="cursor-pointer text-sea hover:text-ink"
                                  onClick={() => startTransition(async () => { await promoteBooking(b.id); router.refresh(); })}
                                >
                                  <ArrowUpCircle className="size-4" />
                                </button>
                              )}
                              <button
                                title="Remove"
                                className="cursor-pointer text-ink/30 hover:text-signal"
                                onClick={() => startTransition(async () => { await cancelBooking(b.id); router.refresh(); })}
                              >
                                <X className="size-3.5" />
                              </button>
                            </span>
                          ))}
                          <Button size="xs" variant={full ? "danger" : "outline"} className="ml-auto" onClick={() => setBookFor(s)}>
                            <UserPlus className="size-3.5" /> {full ? "Waitlist" : "Book"}
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* --- new session dialog --- */}
      <Dialog open={newOpen} onClose={() => setNewOpen(false)} title="New session" eyebrow="Schedule">
        <form action={createSession} className="grid grid-cols-2 gap-4 mt-4">
          <Field label="Title" className="col-span-2">
            <Input name="title" required placeholder="e.g. RYA Level 2 — Day 1" />
          </Field>
          <Field label="Type">
            <Select name="type" defaultValue="Training">{TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
          </Field>
          <Field label="Level">
            <Select name="level" defaultValue="All levels">{LEVELS.map((l) => <option key={l}>{l}</option>)}</Select>
          </Field>
          <Field label="Date" className="col-span-2 sm:col-span-1">
            <Input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          </Field>
          <div className="grid grid-cols-2 gap-3 col-span-2 sm:col-span-1">
            <Field label="Start"><Input name="start" type="time" required defaultValue="10:00" /></Field>
            <Field label="End"><Input name="end" type="time" required defaultValue="12:00" /></Field>
          </div>
          <Field label="Instructor"><Input name="instructor" placeholder="Optional" /></Field>
          <Field label="Capacity"><Input name="capacity" type="number" min={1} defaultValue={8} /></Field>
          <Field label="Description" className="col-span-2">
            <Textarea name="description" placeholder="What will sailors do?" />
          </Field>
          <div className="col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create session"}</Button>
          </div>
        </form>
      </Dialog>

      {/* --- book dialog --- */}
      <Dialog open={!!bookFor} onClose={() => setBookFor(null)} title={bookFor ? `Book into “${bookFor.title}”` : ""} eyebrow="Booking">
        {bookFor && (
          <div className="space-y-4 mt-4">
            <Field label="Member">
              <Select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                <option value="" disabled>Choose a member…</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </Select>
            </Field>
            {bookFor.confirmedCount >= bookFor.capacity && (
              <p className="rounded-lg border border-sun/40 bg-sun/10 px-3 py-2 text-sm font-medium text-[#8a6413]">
                This session is full — the member will be added to the waitlist.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setBookFor(null)}>Cancel</Button>
              <Button onClick={doBook} disabled={!memberId || pending}>{pending ? "Booking…" : "Confirm booking"}</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function BookingChip({ b, onRemove }: { b: BookingView; onRemove: (id: string) => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 pl-1 pr-1.5 py-0.5 text-[11px] font-semibold">
      <Avatar name={b.memberName} size="sm" />
      {b.memberName}
      <button title="Cancel booking" className="cursor-pointer text-ink/30 hover:text-signal transition-colors" onClick={() => onRemove(b.id)}>
        <X className="size-3.5" />
      </button>
    </span>
  );
}
