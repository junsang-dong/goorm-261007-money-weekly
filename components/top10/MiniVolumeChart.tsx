import type { PricePoint } from "@/lib/types";

export function MiniVolumeChart({ points }: { points: PricePoint[] }) {
  const width = 320;
  const height = 72;
  const maxVolume = Math.max(...points.map((point) => point.volume), 1);
  const minClose = Math.min(...points.map((point) => point.close));
  const maxClose = Math.max(...points.map((point) => point.close));
  const span = maxClose - minClose || 1;
  const step = width / points.length;

  const line = points
    .map((point, index) => {
      const x = step * index + step / 2;
      const y = ((maxClose - point.close) / span) * (height - 4) + 2;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" className="h-16 w-full">
      <title>30거래일 거래량 막대와 종가 선</title>
      {points.map((point, index) => {
        const barH = Math.max((point.volume / maxVolume) * (height - 4), 1);
        return (
          <rect
            key={point.date}
            x={step * index + step * 0.15}
            y={height - barH}
            width={Math.max(step * 0.7, 1)}
            height={barH}
            fill="#1E3A5F"
            opacity="0.22"
          />
        );
      })}
      <path d={line} fill="none" stroke="#1A56A4" strokeWidth="1.75" />
    </svg>
  );
}
