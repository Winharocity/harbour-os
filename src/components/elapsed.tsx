"use client";

import { fmtElapsed } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}

export function ElapsedClock({ since, warnMinutes = 150, className }: { since: string; warnMinutes?: number; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now == null) return <span className={className}>—</span>;
  const ms = now - new Date(since).getTime();
  const warn = ms > warnMinutes * 60_000;
  return (
    <span className={className} style={warn ? { color: "var(--color-signal)" } : undefined}>
      {fmtElapsed(ms, true)}
    </span>
  );
}
