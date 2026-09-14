"use client";

import Link from "next/link";
import { cn } from "@/components/admin/ui";
import { AnimatedNumber } from "./AnimatedNumber";
import { Sparkline } from "./Sparkline";

const TONES: Record<string, string> = {
  lime: "#9ad901",
  red: "#f87171",
  yellow: "#fbbf24",
  blue: "#60a5fa",
  purple: "#a78bfa",
};

export function KPICard({
  label,
  value,
  sub,
  growth,
  prefix = "",
  suffix = "",
  tone = "lime",
  href,
  spark,
  compact = false,
}: {
  label: string;
  value: number;
  sub?: string;
  growth?: number;
  prefix?: string;
  suffix?: string;
  tone?: "lime" | "red" | "yellow" | "blue" | "purple";
  href?: string;
  spark?: number[];
  compact?: boolean;
}) {
  const col = TONES[tone] ?? TONES.lime;

  const inner = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-surface-2 transition-all duration-200 hover:border-white/15 hover:bg-surface-3",
        compact ? "p-4" : "p-5"
      )}
    >
      <span
        className="pointer-events-none absolute left-0 top-0 h-full w-1"
        style={{ background: col }}
      />
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-20 blur-3xl"
        style={{ background: col }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="label-kicker">{label}</p>
        {spark && spark.length > 1 && <Sparkline data={spark} color={col} width={88} height={26} />}
      </div>

      <p
        className={cn(
          "relative mt-3 font-display leading-none tracking-wide",
          compact ? "text-3xl" : "text-4xl"
        )}
        style={{ color: col }}
      >
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
      </p>

      <div className="relative mt-3 flex flex-wrap items-center gap-2">
        {growth !== undefined && (
          <span
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold"
            style={{
              color: growth >= 0 ? "#9ad901" : "#f87171",
              background: growth >= 0 ? "#9ad90118" : "#f8717118",
            }}
          >
            {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}%
          </span>
        )}
        {sub && <p className="text-[11px] text-white/35">{sub}</p>}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}