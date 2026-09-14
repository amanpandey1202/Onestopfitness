"use client";

export type HeatmapDay = { date: string; count: number };

export function Heatmap({ data }: { data: HeatmapDay[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  const weeks: HeatmapDay[][] = [];
  let week: HeatmapDay[] = [];
  data.forEach((d, i) => {
    week.push(d);
    if (week.length === 7 || i === data.length - 1) {
      weeks.push(week);
      week = [];
    }
  });

  function colorFor(count: number) {
    if (count === 0) return "rgba(255,255,255,0.06)";
    const pct = count / max;
    if (pct < 0.25) return "#9ad90144";
    if (pct < 0.5) return "#9ad90188";
    if (pct < 0.75) return "#9ad901bb";
    return "#9ad901";
  }

  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((day, di) => (
            <div
              key={di}
              title={`${day.date}: ${day.count} check-in${day.count === 1 ? "" : "s"}`}
              className="h-3 w-3 cursor-default rounded-[2px]"
              style={{ background: colorFor(day.count) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}