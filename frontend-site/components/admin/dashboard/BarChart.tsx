"use client";

export type TrendPoint = { label: string; value: number };

export function BarChart({
  data,
  color = "#9ad901",
  height = 140,
  label,
}: {
  data: TrendPoint[];
  color?: string;
  height?: number;
  label: "revenue" | "members";
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div>
      <div
        className="flex items-end gap-2 border-b border-white/[0.06]"
        style={{ height }}
      >
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center justify-end gap-1.5"
            >
              <div
                className="relative w-full rounded-t-md transition-all duration-700 group-hover:opacity-90"
                style={{
                  height: `${Math.max(pct, 3)}%`,
                  background: `linear-gradient(180deg, ${color} 0%, ${color}66 100%)`,
                  boxShadow: `0 0 12px ${color}44`,
                }}
              >
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-gym-ink px-2 py-0.5 font-mono text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {label === "revenue"
                    ? `₹${d.value.toLocaleString("en-IN")}`
                    : d.value}
                </div>
              </div>
              <span className="text-[9px] font-medium text-white/30">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}