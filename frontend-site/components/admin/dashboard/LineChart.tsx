"use client";

export type TrendPoint = { label: string; value: number };

function buildPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/**
 * Fully responsive SVG line chart — wide viewBox (1200×240) so it fills any
 * card width on desktop without clipping, while scaling down on mobile.
 */
export function LineChart({
  data,
  color = "#9ad901",
  height = 240,
  unit,
}: {
  data: TrendPoint[];
  color?: string;
  height?: number;
  unit?: "revenue" | "count";
}) {
  // Wide internal coordinate space — fills any screen width via SVG scaling
  const W = 1200;
  const H = Math.max(height, 120);
  const PAD = { top: 32, right: 24, bottom: 44, left: 68 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const max = Math.max(...data.map((d) => d.value), 0);
  const niceMax = max === 0 ? 1 : Math.ceil(max * 1.2);
  const min = 0;

  const pts = data.map((d, i) => {
    const x =
      PAD.left +
      (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y =
      PAD.top + innerH - ((d.value - min) / (niceMax - min)) * innerH;
    return { x, y, ...d };
  });

  const line = buildPath(pts);
  const area = pts.length
    ? `${line} L ${pts[pts.length - 1].x} ${PAD.top + innerH} L ${pts[0].x} ${PAD.top + innerH} Z`
    : "";

  const gradId = `grad-${color.replace("#", "")}`;
  const glowId = `glow-${color.replace("#", "")}`;

  const gridLines = 4;
  const fmt = (v: number) =>
    unit === "revenue"
      ? v >= 1000
        ? `₹${Math.round(v / 1000)}k`
        : `₹${v}`
      : String(v);

  // Only label every 2nd point if there are many data points to avoid crowding
  const labelStep = data.length > 8 ? 2 : 1;
  const peakValue = Math.max(...data.map((d) => d.value));

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: `${H}px`, display: "block" }}
        role="img"
        aria-label="trend chart"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="85%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines + Y-axis labels */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = PAD.top + (i / gridLines) * innerH;
          const val = niceMax - (i / gridLines) * (niceMax - min);
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.07)"
                strokeWidth={1}
                strokeDasharray={i === 0 ? "0" : "8 10"}
              />
              <text
                x={PAD.left - 12}
                y={y + 5}
                textAnchor="end"
                fontSize="20"
                fill="rgba(255,255,255,0.35)"
                fontFamily="ui-monospace, monospace"
              >
                {fmt(Math.round(val))}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {area && <path d={area} fill={`url(#${gradId})`} />}

        {/* Line */}
        {line && (
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glowId})`}
          />
        )}

        {/* Dots + conditional value labels */}
        {pts.map((p, i) => (
          <g key={i}>
            {/* Outer glow ring */}
            <circle cx={p.x} cy={p.y} r={9} fill={color} opacity={0.12} />
            {/* Main dot */}
            <circle
              cx={p.x}
              cy={p.y}
              r={5}
              fill={color}
              stroke="#0c1010"
              strokeWidth={2.5}
            >
              <title>{`${p.label}: ${unit === "revenue" ? `₹${p.value.toLocaleString("en-IN")}` : p.value}`}</title>
            </circle>
            {/* Show value label only on peak point */}
            {p.value === peakValue && p.value > 0 && (
              <text
                x={p.x}
                y={p.y - 18}
                textAnchor="middle"
                fontSize="22"
                fontWeight="800"
                fill={color}
                fontFamily="ui-monospace, monospace"
              >
                {fmt(p.value)}
              </text>
            )}
          </g>
        ))}

        {/* X-axis labels — skip alternates when many points */}
        {pts.map((p, i) =>
          i % labelStep === 0 ? (
            <text
              key={`x-${i}`}
              x={p.x}
              y={H - 8}
              textAnchor="middle"
              fontSize="19"
              fill="rgba(255,255,255,0.38)"
              fontFamily="ui-monospace, monospace"
            >
              {p.label}
            </text>
          ) : null
        )}
      </svg>
    </div>
  );
}