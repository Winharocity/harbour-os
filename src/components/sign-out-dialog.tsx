"use client";

import { signOut } from "@/lib/actions";
import { Button, Dialog, Field, Input, Pill, Select, Textarea } from "@/components/ui";
import { Sailboat } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

export type SignOutBoat = {
  id: string;
  name: string;
  className: string;
  capacity: number;
  status: string;
  onWater: boolean;
};

const PURPOSES = ["Free sail", "Lesson", "Racing", "Safety duty", "Test sail / training"];

export function SignOutDialog({
  boats,
  members,
  trigger,
}: {
  boats: SignOutBoat[];
  members: { id: string; name: string }[];
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [boatId, setBoatId] = useState("");
  const [memberId, setMemberId] = useState("");
  const router = useRouter();

  const ready = boats.filter((b) => b.status === "available" && !b.onWater);
  const busy = boats.filter((b) => b.status !== "available" || b.onWater);
  const selectedBoat = boats.find((b) => b.id === boatId);

  function submit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await signOut(fd);
        setOpen(false);
        setBoatId("");
        setMemberId("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-block cursor-pointer">
        {trigger ?? (
          <Button variant="primary">
            <Sailboat className="size-4" /> Sign out a boat
          </Button>
        )}
      </span>
      <Dialog open={open} onClose={() => setOpen(false)} title="Sign out a boat" eyebrow="Water safety log">
        <form action={submit} className="space-y-4 mt-4">
          <Field label="Boat">
            <Select name="boatId" required value={boatId} onChange={(e) => setBoatId(e.target.value)}>
              <option value="" disabled>Choose a boat…</option>
              {ready.length > 0 && (
                <optgroup label={`Ready · ${ready.length}`}>
                  {ready.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.className}
                    </option>
                  ))}
                </optgroup>
              )}
              {busy.length > 0 && (
                <optgroup label="Unavailable">
                  {busy.map((b) => (
                    <option key={b.id} value={b.id} disabled>
                      {b.name} — {b.onWater ? "on the water" : "maintenance"}
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>
          </Field>
          {selectedBoat && (
            <div className="flex items-center gap-2 -mt-2">
              <Pill tone="sea">seats {selectedBoat.capacity}</Pill>
              <Pill tone="foam">{selectedBoat.className}</Pill>
            </div>
          )}

          <Field label="Helm · pick a member or type a name">
            <Select
              name="memberId"
              value={memberId}
              onChange={(e) => {
                setMemberId(e.target.value);
                const m = members.find((x) => x.id === e.target.value);
                const input = document.getElementById("helmName-input") as HTMLInputElement | null;
                if (m && input) input.value = m.name;
              }}
            >
              <option value="">Guest / not listed…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Helm name">
            <Input id="helmName-input" name="helmName" required placeholder="Who is helming?" autoComplete="off" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="People aboard">
              <Input name="crewCount" type="number" min={1} max={selectedBoat?.capacity ?? 12} defaultValue={1} required />
            </Field>
            <Field label="Purpose">
              <Select name="purpose" defaultValue="Free sail">
                {PURPOSES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Sailing area (optional)">
            <Input name="area" placeholder="e.g. North of the pier, race area A" />
          </Field>
          <Field label="Notes (optional)">
            <Textarea name="notes" placeholder="Anything the duty team should know…" />
          </Field>

          {error && (
            <p className="rounded-lg border border-signal/30 bg-signal/8 px-3 py-2 text-sm font-medium text-signal-dark">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              <Sailboat className="size-4" />
              {pending ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
