"use client";

import { addMember, removeMember } from "@/lib/actions";
import type { MemberRow } from "@/lib/queries";
import { Avatar, Button, Dialog, EmptyState, Field, Input, Pill, Select } from "@/components/ui";
import { Phone, Plus, Search, Shield, Trash2, UserRound, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const QUALIFICATIONS = [
  "None", "RYA Level 1", "RYA Level 2", "RYA Level 3", "RYA Level 4",
  "RYA Seamanship", "RYA Dinghy Instructor", "RYA Senior Instructor", "PB2 (Powerboat)",
];
const MEMBERSHIPS = ["Adult", "Junior", "Family", "Instructor", "Day sailor", "Honorary"];

export function MembersBoard({ members }: { members: MemberRow[] }) {
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((m) =>
      [m.name, m.email ?? "", m.phone ?? "", m.qualification, m.membershipType]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [members, q]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <p className="label-mono text-sea mb-2">{members.length} sailor{members.length === 1 ? "" : "s"} registered</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none">Members</h1>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="size-4" /> Add member</Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink/30 pointer-events-none" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, qualification, phone…" className="pl-9" />
      </div>

      {members.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users className="size-7" />}
            title="No members yet"
            body="Add sailors with their qualifications and emergency contacts — they can then be booked onto sessions and signed onto the water."
            action={<Button onClick={() => setAddOpen(true)}><Plus className="size-4" /> Add member</Button>}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-10 text-center text-sm text-ink/50">No members match “{q}”.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.4fr_1fr_1fr_1.2fr_auto] gap-3 px-5 py-2.5 border-b border-line/70 label-mono text-ink/40">
            <span>Member</span><span>Qualification</span><span>Membership</span><span>Contact</span><span />
          </div>
          <ul className="divide-y divide-line/60">
            {filtered.map((m) => (
              <li key={m.id} className="grid md:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto] gap-x-3 gap-y-2 px-5 py-3.5 items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={m.name} />
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{m.name}</p>
                    {m.emergencyContact && (
                      <p className="text-[11px] text-ink/45 truncate inline-flex items-center gap-1">
                        <Shield className="size-3 text-sea" /> ICE: {m.emergencyContact}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Pill tone={m.qualification.includes("Instructor") || m.qualification.includes("PB2") ? "sea" : m.qualification === "None" ? "foam" : "sky"}>
                    {m.qualification}
                  </Pill>
                </div>
                <p className="text-sm text-ink/60 flex items-center gap-1.5"><UserRound className="size-3.5 text-ink/25" /> {m.membershipType}</p>
                <div className="text-xs text-ink/55 min-w-0">
                  {m.phone && <p className="truncate inline-flex items-center gap-1.5 mr-3"><Phone className="size-3 text-ink/25" /> {m.phone}</p>}
                  {m.email && <p className="truncate">{m.email}</p>}
                </div>
                <button
                  title="Remove member"
                  className="cursor-pointer justify-self-end rounded-md p-1.5 text-ink/20 hover:text-signal hover:bg-signal/8 transition-colors"
                  onClick={() => {
                    if (confirm(`Remove ${m.name}? Their bookings will be cancelled.`)) {
                      startTransition(async () => { await removeMember(m.id); router.refresh(); });
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add member" eyebrow="Members register">
        <form
          action={(fd) => startTransition(async () => { await addMember(fd); setAddOpen(false); router.refresh(); })}
          className="grid grid-cols-2 gap-4 mt-4"
        >
          <Field label="Full name" className="col-span-2"><Input name="name" required placeholder="e.g. Marta Ellison" autoComplete="off" /></Field>
          <Field label="Email"><Input name="email" type="email" placeholder="Optional" /></Field>
          <Field label="Phone"><Input name="phone" placeholder="Optional" /></Field>
          <Field label="Qualification">
            <Select name="qualification" defaultValue="None">{QUALIFICATIONS.map((x) => <option key={x}>{x}</option>)}</Select>
          </Field>
          <Field label="Membership">
            <Select name="membershipType" defaultValue="Adult">{MEMBERSHIPS.map((x) => <option key={x}>{x}</option>)}</Select>
          </Field>
          <Field label="Emergency contact" className="col-span-2">
            <Input name="emergencyContact" placeholder="Name · phone" />
          </Field>
          <div className="col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add member"}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
