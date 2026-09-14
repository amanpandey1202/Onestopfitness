"use client";

export function RevenueSplit({
  online = 0,
  cash = 0,
  excel = 0,
}: {
  online?: number;
  cash?: number;
  excel?: number;
}) {
  const total = online + cash + excel;
  if (total <= 0) return null;

  const rows = [
    { key: "Online (Razorpay)", value: online, color: "#9ad901" },
    { key: "Cash", value: cash, color: "#38bdf8" },
    { key: "Excel / Manual", value: excel, color: "#a78bfa" },
  ];

  return (
    <div className="space-y-4">
      {rows.map((r) => {
        const pct = r.value === 0 ? 0 : (r.value / total) * 100;
        return (
          <div key={r.key}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-semibold text-white/70">
                <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                {r.key}
              </span>
              <span
                className="font-mono font-bold"
                style={{ color: r.color }}
              >
                {pct.toFixed(0)}% · ₹{r.value.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: r.color,
                  boxShadow: `0 0 10px ${r.color}66`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}