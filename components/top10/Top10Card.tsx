import { MiniVolumeChart } from "@/components/top10/MiniVolumeChart";
import { formatPct, formatVolume, formatVolumeFull, isVolumeSpike } from "@/lib/format";
import type { IssueNote, Top10Item } from "@/lib/types";
import Link from "next/link";
import { RankBadge, RankChangeMark } from "@/components/top10/RankBadge";

export function Top10Card({
  item,
  names,
  watched,
  onToggle,
  issue,
}: {
  item: Top10Item;
  names: Record<string, string>;
  watched: boolean;
  onToggle?: (item: Top10Item) => void;
  issue?: IssueNote;
}) {
  const spike = isVolumeSpike(item.volumeChangePct);
  const volumeTone = item.volumeChangePct > 0 ? "text-up" : item.volumeChangePct < 0 ? "text-down" : "text-muted";
  const priceTone =
    item.priceChangePct === null
      ? "text-muted"
      : item.priceChangePct > 0
        ? "text-up"
        : "text-down";

  return (
    <article
      id={`stock-${item.code}`}
      className={`flex flex-col justify-between rounded-md border border-line bg-card p-3 transition hover:border-slate-300 hover:shadow-[0_4px_12px_-2px_rgba(15,23,42,0.06)] ${
        item.rank <= 3 ? "shadow-[inset_3px_0_0_#1E3A5F]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <RankBadge rank={item.rank} />
            <Link href={`/stock/${item.code}`} className="text-sm font-semibold text-ink hover:text-navy">
              {item.name}
            </Link>
            <span className="font-mono text-xs text-muted">{item.code}</span>
            <span className="rounded-sm border border-line bg-tint px-1.5 py-0.5 text-[0.6875rem] font-semibold text-navy">
              {item.theme}
            </span>
          </div>
          <p className="mt-1 text-xs leading-snug text-muted">{item.note}</p>
          {issue ? (
            <p className="mt-1 text-xs leading-snug text-ink">
              {issue.oneOff ? (
                <span className="mr-1 rounded-sm bg-spike-bg px-1 py-0.5 text-[0.6875rem] font-semibold text-spike">일회성</span>
              ) : null}
              {issue.text}
              {issue.citations.length > 0 ? <span className="text-muted"> [{issue.citations.join("][")}]</span> : null}
            </p>
          ) : null}
          {watched ? (
            <span className="mt-1 inline-block text-[0.6875rem] font-semibold text-navy">내 관심 종목</span>
          ) : null}
          {item.preferredCode ? (
            <a href={`#stock-${item.preferredCode}`} className="mt-1 inline-block text-[0.6875rem] font-semibold text-blue">
              우선주도 TOP10 · {names[item.preferredCode] ?? item.preferredCode}
            </a>
          ) : null}
          {item.commonCode ? (
            <a href={`#stock-${item.commonCode}`} className="mt-1 inline-block text-[0.6875rem] font-semibold text-blue">
              보통주 {names[item.commonCode] ?? item.commonCode}와 연결
            </a>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <RankChangeMark value={item.rankChange} />
          {onToggle ? (
            <button
              type="button"
              aria-pressed={watched}
              aria-label={watched ? `${item.name} 관심 해제` : `${item.name} 관심 추가`}
              onClick={() => onToggle(item)}
              className={`text-lg leading-none ${watched ? "text-spike" : "text-muted hover:text-navy"}`}
            >
              {watched ? "★" : "☆"}
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className={`num text-sm font-semibold ${item.closePrice === null ? priceTone : "text-ink"}`}>
          {item.closePrice === null ? (
            item.priceChangePct === null ? "종가 —" : `주가 ${formatPct(item.priceChangePct)}`
          ) : (
            <>
              {item.closePrice.toLocaleString("ko-KR")}
              <span className="ml-0.5 text-xs font-normal text-muted">원</span>
            </>
          )}
        </p>
        {item.closePrice !== null && item.priceChangePct !== null ? (
          <p className={`num text-xs font-semibold ${priceTone}`}>{formatPct(item.priceChangePct)}</p>
        ) : null}
        <div className="text-right">
          <p className="num text-sm font-semibold text-ink" title={formatVolumeFull(item.volume)}>
            {formatVolume(item.volume)}
          </p>
          <p className={`num text-xs font-medium ${volumeTone}`}>
            거래량 {formatPct(item.volumeChangePct)}
            {spike ? (
              <span className="ml-1 rounded-sm border border-amber-200 bg-spike-bg px-1 py-0.5 text-[0.6875rem] font-semibold text-spike">
                급증
              </span>
            ) : null}
          </p>
        </div>
      </div>
      <div className="mt-3 border-t border-line pt-2">
        <p className="text-[0.6875rem] text-muted">30거래일 · 막대 거래량 · 선 종가</p>
        {item.points && item.points.length >= 2 ? (
          <MiniVolumeChart points={item.points} />
        ) : (
          <p className="mt-1 text-xs text-muted">30거래일 시세가 없습니다.</p>
        )}
      </div>
    </article>
  );
}
