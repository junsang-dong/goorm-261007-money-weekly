import type { PricePoint } from "@/lib/types";

export function VolumeChart({ points, average }: { points: PricePoint[]; average: number | null }) {
  if (points.length < 2) {
    return <p className="text-sm text-muted">30거래일 시세가 부족해 차트를 그리지 않았습니다.</p>;
  }

  const width = 640;
  const height = 220;
  const pad = { left: 8, right: 8, top: 16, bottom: 28 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxVolume = Math.max(...points.map((point) => point.volume), 1);
  const minClose = Math.min(...points.map((point) => point.close));
  const maxClose = Math.max(...points.map((point) => point.close));
  const span = maxClose - minClose || 1;
  const step = innerW / points.length;

  const line = points
    .map((point, index) => {
      const x = pad.left + step * index + step / 2;
      const y = pad.top + ((maxClose - point.close) / span) * innerH;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const averageY =
    average === null ? null : pad.top + innerH - (Math.min(average, maxVolume) / maxVolume) * innerH;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" className="h-auto w-full">
      <title>30거래일 거래량 막대와 종가 선</title>
      {points.map((point, index) => {
        const barH = (point.volume / maxVolume) * innerH;
        const x = pad.left + step * index + step * 0.2;
        return (
          <rect
            key={point.date}
            x={x}
            y={pad.top + innerH - barH}
            width={Math.max(step * 0.6, 1)}
            height={barH}
            fill="#1E3A5F"
            opacity="0.28"
          >
            <title>{`${point.date} 거래량 ${point.volume.toLocaleString("ko-KR")}주`}</title>
          </rect>
        );
      })}
      {averageY !== null ? (
        <line x1={pad.left} x2={width - pad.right} y1={averageY} y2={averageY} stroke="#B45309" strokeDasharray="4 3" />
      ) : null}
      <path d={line} fill="none" stroke="#1A56A4" strokeWidth="2" />
      <text x={pad.left} y={height - 8} fill="#64748B" fontSize="11">
        {points[0]?.date} · 막대 거래량 · 파란 선 종가 · 점선 30일 평균 거래량
      </text>
    </svg>
  );
}
