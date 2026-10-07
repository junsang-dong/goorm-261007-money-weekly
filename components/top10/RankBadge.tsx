import type { RankChange } from "@/lib/types";

const RANK_TONE = [
  "",
  "bg-navy text-white",
  "bg-blue text-white",
  "bg-sky text-white",
];

export function RankBadge({ rank }: { rank: number }) {
  const tone = RANK_TONE[rank] ?? "border border-line bg-tint text-ink";
  return (
    <span
      className={`inline-flex h-6 min-w-6 items-center justify-center rounded-sm px-1 font-mono text-xs font-semibold ${tone}`}
    >
      {rank}
    </span>
  );
}

export function RankChangeMark({ value }: { value: RankChange }) {
  if (value === "new") {
    return (
      <span className="rounded-sm bg-blue/10 px-1.5 py-0.5 font-mono text-[0.6875rem] font-semibold text-blue">
        NEW
      </span>
    );
  }
  if (value === null) {
    return <span className="font-mono text-xs text-muted">–</span>;
  }
  if (value > 0) {
    return <span className="num font-mono text-xs font-semibold text-up">▲ {value}</span>;
  }
  return <span className="num font-mono text-xs font-semibold text-down">▼ {Math.abs(value)}</span>;
}
