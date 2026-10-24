"use client";

import type { WeatherReport } from "@/lib/weather";
import { degToCompass, fmtTime, ktsToBeaufort } from "@/lib/utils";
import { motion } from "framer-motion";
import { CloudRain, Droplets, Sunrise, Sunset, Thermometer, Waves, Wind } from "lucide-react";

function beaufortColor(f: number) {
  if (f >= 7) return "text-signal";
  if (f >= 5) return "text-sun";
  return "text-tide";
}

function WindDial({ dir, wind }: { dir: number; wind: number }) {
  const ticks = [];
  for (let a = 0; a < 360; a += 15) {
    const major = a % 90 === 0;
    const cardinal = a % 45 === 0;
    ticks.push(
      <line
        key={a}
        x1="100" y1="14" x2="100" y2={major ? 26 : cardinal ? 22 : 19}
        stroke={major ? "rgba(245,242,233,0.85)" : "rgba(245,242,233,0.28)"}
        strokeWidth={major ? 2 : 1}
        transform={`rotate(${a} 100 100)`}
      />,
    );
  }
  const beaufort = ktsToBeaufort(wind);

  return (
    <div className="relative">
      <svg viewBox="0 0 200 200" className="w-full max-w-52 mx-auto">
        <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(245,242,233,0.12)" strokeWidth="1" />
        <circle cx="100" cy="100" r="62" fill="none" stroke="rgba(245,242,233,0.10)" strokeWidth="1" strokeDasharray="2 5" />
        {ticks}
        {["N", "E", "S", "W"].map((c, i) => (
          <text
            key={c}
            x="100"
            y="42"
            textAnchor="middle"
            className="fill-salt/80 font-mono"
            fontSize="11"
            fontWeight="600"
            transform={`rotate(${i * 90} 100 100)`}
          >
            {c}
          </text>
        ))}
        {/* rotating wind needle (points where wind comes FROM) */}
        <motion.g
          initial={false}
          animate={{ rotate: dir }}
          style={{ transformBox: "view-box", originX: "100px", originY: "100px" }}
          transition={{ type: "spring", stiffness: 40, damping: 12 }}
        >
          <polygon points="100,34 93,100 100,90 107,100" fill="#e8482b" />
          <polygon points="100,166 95,102 100,110 105,102" fill="rgba(245,242,233,0.45)" />
        </motion.g>
        <circle cx="100" cy="100" r="46" fill="#0a1f2e" stroke="rgba(245,242,233,0.14)" />
        <text x="100" y="92" textAnchor="middle" className="fill-salt font-mono tabular" fontSize="30" fontWeight="700">
          {Math.round(wind)}
        </text>
        <text x="100" y="110" textAnchor="middle" className="fill-salt/45 font-mono" fontSize="9" letterSpacing="2">
          KNOTS
        </text>
        <text x="100" y="126" textAnchor="middle" className={`font-mono ${beaufortColor(beaufort)}`} fontSize="10" fontWeight="700">
          F{beaufort} · {degToCompass(dir)}
        </text>
      </svg>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, tone }: {
  icon: typeof Wind;
  label: string;
  value: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-salt/40 mb-1.5">
        <Icon className="size-3.5" />
        <span className="font-mono text-[9px] uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className={`font-mono font-bold text-lg leading-none tabular ${tone ?? "text-salt"}`}>{value}</p>
      {sub && <p className="text-[11px] text-salt/40 mt-1">{sub}</p>}
    </div>
  );
}

export function WeatherPanel({ report, compact = false }: { report: WeatherReport; compact?: boolean }) {
  const maxGust = Math.max(...report.hours.map((h) => h.gust), 10);
  const beaufort = report.beaufort;

  return (
    <div className="card-dark text-salt overflow-hidden">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="pulse-soft size-2 rounded-full bg-tide" />
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-salt/60">
            Harbour weather · live
          </p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-salt/40">
          {report.condition} · updated {fmtTime(report.fetchedAt)}
        </p>
      </div>

      <div className="grid gap-5 px-5 pb-5 md:grid-cols-[auto_1fr]">
        {/* dial + gusts */}
        <div className="flex flex-col items-center">
          <WindDial dir={report.windDir} wind={report.windKt} />
          <div className="mt-2 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-salt/40">Gusting</p>
            <p className="font-mono text-xl font-bold tabular text-sun">{Math.round(report.gustKt)} kn</p>
          </div>
        </div>

        {/* stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 content-start">
          <Stat
            icon={Wind}
            label="Beaufort"
            value={`Force ${beaufort}`}
            sub={report.beaufortName}
            tone={beaufortColor(beaufort)}
          />
          <Stat
            icon={Waves}
            label="Sea state"
            value={report.waveM != null ? `${report.waveM.toFixed(1)} m` : "—"}
            sub={report.wavePeriodS != null ? `period ${Math.round(report.wavePeriodS)}s` : undefined}
          />
          <Stat
            icon={Thermometer}
            label="Air"
            value={`${Math.round(report.tempC)}°C`}
            sub={`feels ${Math.round(report.feelsC)}°`}
          />
          <Stat
            icon={Droplets}
            label="Swell"
            value={report.swellM != null ? `${report.swellM.toFixed(1)} m` : "—"}
          />
          <Stat
            icon={Sunrise}
            label="Sunrise"
            value={report.sunrise ? fmtTime(report.sunrise) : "—"}
          />
          <Stat
            icon={Sunset}
            label="Sunset"
            value={report.sunset ? fmtTime(report.sunset) : "—"}
          />
        </div>
      </div>

      {/* hourly strip */}
      {!compact && (
        <div className="hairline-t px-5 pt-4 pb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-salt/50">Next hours</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-salt/30 flex items-center gap-1.5">
              <CloudRain className="size-3" /> precip % · open-meteo.com
            </p>
          </div>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${report.hours.length}, minmax(0,1fr))` }}>
            {report.hours.map((h, i) => {
              const hPct = Math.max(8, (h.wind / maxGust) * 100);
              const gPct = Math.max(8, (h.gust / maxGust) * 100);
              const f = ktsToBeaufort(h.wind);
              return (
                <div key={h.time} className="flex flex-col items-center gap-1.5">
                  <span className={`font-mono text-[9px] tabular ${f >= 7 ? "text-signal" : "text-salt/50"}`}>
                    {h.prob > 0 && h.prob >= 25 ? `${Math.round(h.prob)}%` : ""}
                  </span>
                  <div className="relative h-20 w-full flex items-end justify-center">
                    <motion.span
                      title={`${fmtTime(h.time)} — ${Math.round(h.wind)} kn gusting ${Math.round(h.gust)} kn`}
                      className={`absolute bottom-0 w-2 rounded-t-full ${f >= 7 ? "bg-signal/70" : f >= 5 ? "bg-sun/70" : "bg-tide/70"}`}
                      initial={{ height: 0 }}
                      animate={{ height: `${gPct}%` }}
                      transition={{ delay: i * 0.04, type: "spring", stiffness: 120, damping: 20 }}
                    />
                    <motion.span
                      className={`absolute bottom-0 w-4 rounded-t-md ${f >= 7 ? "bg-signal" : f >= 5 ? "bg-sun" : "bg-tide"}`}
                      initial={{ height: 0 }}
                      animate={{ height: `${hPct}%` }}
                      transition={{ delay: i * 0.04 + 0.06, type: "spring", stiffness: 120, damping: 20 }}
                    />
                  </div>
                  <span className="font-mono text-[9px] tabular text-salt/60">{Math.round(h.wind)}</span>
                  <span className="font-mono text-[9px] tabular text-salt/30">{h.time.slice(11, 13)}h</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
