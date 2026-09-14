"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import MiniLineChart from "@/components/member/MiniLineChart";
import Icon from "@/components/Icon";

type Measurement = {
  id: string;
  recordedAt: string;
  weightKg: number | null;
  heightCm: number | null;
  bodyFatPct: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  notes: string | null;
};

const METRICS: { key: keyof Measurement; label: string; unit: string; color: string }[] = [
  { key: "weightKg",  label: "Weight",   unit: "kg", color: "#9AD901" },
  { key: "bodyFatPct", label: "Body Fat", unit: "%",  color: "#f59e0b" },
  { key: "waistCm",   label: "Waist",    unit: "cm", color: "#ef4444" },
  { key: "chestCm",   label: "Chest",    unit: "cm", color: "#3b82f6" },
  { key: "armCm",     label: "Arm",      unit: "cm", color: "#8b5cf6" },
];

export default function MemberMeasurementsPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me/measurements")
      .then((r) => r.json())
      .then((d) => setMeasurements(d.measurements ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const latest   = measurements[measurements.length - 1];
  const previous = measurements[measurements.length - 2];
  const totalSessions = measurements.length;

  return (
    <div className="space-y-8">

      {/* ── Page header ── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gym-lime">Member Portal</p>
        <h1 className="mt-1 font-anton text-4xl uppercase leading-none tracking-wide text-white">
          Body Progress
        </h1>
        <p className="mt-2 text-sm text-white/50">
          {totalSessions > 0
            ? `Tracked by your trainer · ${totalSessions} session${totalSessions === 1 ? "" : "s"} logged`
            : "Tracked by your trainer at each session."}
        </p>
      </div>

      {measurements.length === 0 ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.07] bg-surface-2 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-white/30">
            <Icon name="activity" className="h-8 w-8" />
          </span>
          <div>
            <p className="font-semibold text-white/70">No measurements yet</p>
            <p className="mt-1 text-sm text-white/35">
              Ask your trainer to log your first session — your progress will appear here.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Metric snapshot cards ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {METRICS.map(({ key, label, unit, color }) => {
              const val  = latest?.[key]  as number | null;
              const prev = previous?.[key] as number | null;
              const delta = val != null && prev != null ? val - prev : null;

              return (
                <div
                  key={key}
                  className="rounded-2xl border border-white/[0.07] bg-surface-2 p-4"
                  style={{ borderTop: `3px solid ${color}22` }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    {label}
                  </p>
                  <p
                    className="mt-3 font-anton text-4xl leading-none"
                    style={{ color }}
                  >
                    {val != null ? val : "—"}
                    {val != null && (
                      <span className="ml-1 font-sans text-sm font-semibold text-white/40">
                        {unit}
                      </span>
                    )}
                  </p>

                  {delta != null && (
                    <span
                      className={`mt-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                        delta < 0 && key === "weightKg"
                          ? "bg-gym-lime/15 text-gym-lime"
                          : delta > 0 && key !== "weightKg"
                            ? "bg-red-500/15 text-red-400"
                            : "bg-white/10 text-white/60"
                      }`}
                    >
                      {delta > 0 ? "+" : ""}{delta.toFixed(1)}{unit}
                    </span>
                  )}

                  <div className="mt-3">
                    <MiniLineChart
                      color={color}
                      data={measurements
                        .filter((m) => m[key] != null)
                        .map((m, i) => ({ x: i, y: m[key] as number }))}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Full history — card list (replaces unreadable table) ── */}
          <div>
            <h2 className="mb-4 font-anton text-xl uppercase tracking-wide text-white">
              Session History
            </h2>
            <div className="space-y-3">
              {[...measurements].reverse().map((m, idx) => {
                const sessionNum = measurements.length - idx;
                const filled = METRICS.filter(({ key }) => m[key] != null);

                return (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-white/[0.07] bg-surface-2 p-5"
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gym-lime/15 font-anton text-sm text-gym-lime">
                          {sessionNum}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            Session #{sessionNum}
                          </p>
                          <p className="text-xs text-white/40">{formatDate(m.recordedAt)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Metric grid */}
                    {filled.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {filled.map(({ key, label, unit, color }) => (
                          <div key={key} className="rounded-xl border border-white/[0.05] bg-surface-3 px-3 py-2">
                            <p className="text-[10px] text-white/40 uppercase tracking-wide">{label}</p>
                            <p className="mt-0.5 font-semibold" style={{ color }}>
                              {m[key]}{unit}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {m.notes && (
                      <p className="mt-3 text-xs italic text-white/40">&quot;{m.notes}&quot;</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
