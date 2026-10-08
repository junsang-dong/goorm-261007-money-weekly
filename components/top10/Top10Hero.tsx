"use client";

import { Top10Card } from "@/components/top10/Top10Card";
import type { IssueNote, Top10Response } from "@/lib/types";
import { useState } from "react";

export function Top10Hero({
  data,
  watchedCodes,
  onToggle,
  notice,
  issues,
}: {
  data: Top10Response;
  watchedCodes: Set<string>;
  onToggle?: (item: { code: string; name: string }) => void;
  notice?: string | null;
  issues?: IssueNote[];
}) {
  const [view, setView] = useState<"day" | "week">("day");
  const names = Object.fromEntries(data.items.map((item) => [item.code, item.name]));
  const issueByCode = new Map((issues ?? []).map((issue) => [issue.code, issue]));

  return (
    <section>
      <div className="mb-3 flex flex-col gap-2 rounded-md bg-tint px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold text-ink">이번 주 시장 관심도 TOP 10</h2>
          <span className="text-xs text-muted">거래량 변동성</span>
          <span className="group relative">
            <button type="button" className="text-xs text-muted underline decoration-dotted" aria-describedby="attention-tip">
              관심도 설명
            </button>
            <span
              id="attention-tip"
              role="tooltip"
              className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-72 rounded-md bg-navy p-2 text-xs leading-relaxed text-white group-hover:block group-focus-within:block"
            >
              관심도는 거래량이 평소보다 얼마나 크게 출렁였는지를 뜻하며, 주가 상승을 의미하지 않습니다.
            </span>
          </span>
        </div>
        <div className="inline-flex rounded-md bg-line/60 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setView("day")}
            className={`rounded-sm px-2 py-1 ${view === "day" ? "bg-card font-semibold text-ink" : "text-muted"}`}
          >
            최근 거래일
          </button>
          <button
            type="button"
            onClick={() => setView("week")}
            className={`rounded-sm px-2 py-1 ${view === "week" ? "bg-card font-semibold text-ink" : "text-muted"}`}
          >
            주간
          </button>
        </div>
      </div>
      <p className="mb-3 text-xs text-muted">
        기준 {data.asOf} · {data.source}. {data.rankChangeNote}
        {view === "week" ? " 주간 누적 순위는 Phase 2입니다. 지금은 같은 목업을 보여 줍니다." : ""}
      </p>
      {notice ? <p className="mb-3 text-xs font-medium text-spike">{notice}</p> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.items.map((item) => (
          <Top10Card
            key={item.code}
            item={item}
            names={names}
            watched={watchedCodes.has(item.code)}
            onToggle={onToggle}
            issue={issueByCode.get(item.code)}
          />
        ))}
      </div>
    </section>
  );
}
