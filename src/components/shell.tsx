"use client";

import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Gauge,
  LifeBuoy,
  Radar,
  Sailboat,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/", label: "Overview", icon: Gauge },
  { href: "/water", label: "On the Water", icon: Radar },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/fleet", label: "Fleet", icon: Sailboat },
  { href: "/members", label: "Members", icon: Users },
];

export function Shell({ children, centreName }: { children: ReactNode; centreName: string }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      {/* -------- desktop sidebar -------- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-ink text-salt lg:flex">
        <div className="px-5 pt-6 pb-5 border-b border-white/8">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="grid place-items-center size-9 rounded-xl bg-signal text-white shadow-[0_8px_20px_-6px_rgba(232,72,43,0.7)] group-hover:rotate-6 transition-transform">
              <Sailboat className="size-5" />
            </span>
            <span>
              <span className="block font-black tracking-tight text-[15px] leading-none">
                HARBOUR<span className="text-sun">·</span>OS
              </span>
              <span className="block text-[10px] font-mono uppercase tracking-[0.18em] text-salt/45 mt-1 truncate max-w-36">
                {centreName}
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
                  active
                    ? "bg-salt text-ink shadow-[0_8px_20px_-10px_rgba(0,0,0,0.6)]"
                    : "text-salt/60 hover:text-salt hover:bg-white/6",
                )}
              >
                <item.icon className={cn("size-4.5", active ? "text-signal" : "text-salt/50")} />
                {item.label}
                {active && <span className="ml-auto size-1.5 rounded-full bg-signal" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-5 border-t border-white/8">
          <div className="flex items-center gap-2 text-salt/40">
            <LifeBuoy className="size-4" />
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] leading-relaxed">
              Self-hosted ops
              <br />
              for the water
            </p>
          </div>
        </div>
      </aside>

      {/* -------- mobile top bar -------- */}
      <header className="lg:hidden sticky top-0 z-40 bg-ink text-salt">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="grid place-items-center size-8 rounded-lg bg-signal text-white">
            <Sailboat className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="font-black tracking-tight text-sm leading-none">HARBOUR·OS</p>
            <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-salt/45 mt-0.5 truncate">{centreName}</p>
          </div>
        </div>
        <nav className="flex overflow-x-auto px-2 pb-2 gap-1">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold",
                  active ? "bg-salt text-ink" : "text-salt/60",
                )}
              >
                <item.icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="lg:pl-60">{children}</main>
    </div>
  );
}
