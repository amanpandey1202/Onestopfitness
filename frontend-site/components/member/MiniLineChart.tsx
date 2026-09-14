/**
 * Tiny SVG sparkline used by the member dashboard and measurements page.
 * Returns null when there aren't enough data points to draw a line.
 */
export default function MiniLineChart({
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

  const xFor = (i: number) => pad + (i / (data.length - 1)) * (w - pad * 2);
  const yFor = (y: number) => h - pad - ((y - minY) / range) * (h - pad * 2);

  const points = data.map((d, i) => `${xFor(i)},${yFor(d.y)}`);

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
      {data.map((d, i) => (
        <circle key={i} cx={xFor(i)} cy={yFor(d.y)} r="3" fill={color} />
      ))}
    </svg>
  );
}