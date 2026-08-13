"use client";

import { useEffect, useState } from "react";
import { Badge, Card, Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

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
  { key: "weightKg", label: "Weight", unit: "kg", color: "#9AD901" },
  { key: "bodyFatPct", label: "Body Fat", unit: "%", color: "#f59e0b" },
  { key: "waistCm", label: "Waist", unit: "cm", color: "#ef4444" },
  { key: "chestCm", label: "Chest", unit: "cm", color: "#3b82f6" },
  { key: "armCm", label: "Arm", unit: "cm", color: "#8b5cf6" },
];

function MiniLineChart({
  data,
  color,
}: {
  data: { x: number; y: number }[];
  color: string;
}) {
  if (data.length < 2) return null;
  const maxY = Math.max(...data.map((d) => d.y));
  const minY = Math.min(...data.map((d) => d.y));
  const range = maxY - minY || 1;
  const w = 180;
  const h = 60;
  const pad = 8;

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((d.y - minY) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2);
        const y = h - pad - ((d.y - minY) / range) * (h - pad * 2);
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
}

export default function MemberMeasurementsPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me/measurements")
      .then((r) => r.json())
      .then((d) => setMeasurements(d.measurements ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;

  const latest = measurements[measurements.length - 1];
  const previous = measurements[measurements.length - 2];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white">
          Body Measurements
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Tracked by your trainer at each session. Progress you can see.
        </p>
      </div>

      {measurements.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-white/50">No measurements recorded yet.</p>
          <p className="mt-2 text-xs text-white/30">Ask your trainer to log your first measurement.</p>
        </Card>
      ) : (
        <>
          {/* Latest snapshot */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {METRICS.map(({ key, label, unit, color }) => {
              const val = latest?.[key] as number | null;
              const prev = previous?.[key] as number | null;
              const delta = val != null && prev != null ? val - prev : null;
              return (
                <Card key={key} className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{label}</p>
                  <p className="mt-2 font-display text-3xl font-bold" style={{ color }}>
                    {val != null ? `${val}${unit}` : "—"}
                  </p>
                  {delta != null && (
                    <Badge tone={delta < 0 && key === "weightKg" ? "green" : delta > 0 && key !== "weightKg" ? "red" : "neutral"}>
                      {delta > 0 ? "+" : ""}{delta.toFixed(1)}{unit}
                    </Badge>
                  )}
                  <div className="mt-3">
                    <MiniLineChart
                      color={color}
                      data={measurements
                        .filter((m) => m[key] != null)
                        .map((m, i) => ({ x: i, y: m[key] as number }))}
                    />
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Full history table */}
          <Card>
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
                Full History
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Weight</th>
                    <th className="px-4 py-3">Body Fat</th>
                    <th className="px-4 py-3">Waist</th>
                    <th className="px-4 py-3">Chest</th>
                    <th className="px-4 py-3">Arm</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {[...measurements].reverse().map((m) => (
                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white/70">{formatDate(m.recordedAt)}</td>
                      <td className="px-4 py-3 text-white">{m.weightKg ? `${m.weightKg}kg` : "—"}</td>
                      <td className="px-4 py-3 text-white">{m.bodyFatPct ? `${m.bodyFatPct}%` : "—"}</td>
                      <td className="px-4 py-3 text-white">{m.waistCm ? `${m.waistCm}cm` : "—"}</td>
                      <td className="px-4 py-3 text-white">{m.chestCm ? `${m.chestCm}cm` : "—"}</td>
                      <td className="px-4 py-3 text-white">{m.armCm ? `${m.armCm}cm` : "—"}</td>
                      <td className="px-4 py-3 text-white/50 text-xs max-w-[160px] truncate">{m.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
