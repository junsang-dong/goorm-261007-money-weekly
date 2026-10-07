import { formatPct, formatVolume } from "@/lib/format";
import type { Top10Item } from "@/lib/types";

export function Top10Preview({ items }: { items: Top10Item[] }) {
  return (
    <ol className="divide-y divide-line border border-line bg-card">
      {items.map((item) => (
        <li key={item.code} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <span className="num w-5 font-mono text-xs text-muted">{item.rank}</span>
            <span className="truncate font-semibold">{item.name}</span>
            <span className="hidden font-mono text-xs text-muted sm:inline">{item.code}</span>
          </span>
          <span className="num shrink-0 text-right text-xs">
            <span className="block font-semibold">{formatVolume(item.volume)}</span>
            <span className={item.volumeChangePct >= 0 ? "text-up" : "text-down"}>
              {formatPct(item.volumeChangePct)}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
