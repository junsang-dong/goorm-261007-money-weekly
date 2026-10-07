"use client";

import { AppHeader } from "@/components/AppHeader";
import { Disclaimer } from "@/components/Disclaimer";
import { RequireAuth } from "@/components/RequireAuth";
import { ThemeInsight } from "@/components/top10/ThemeInsight";
import { Top10Hero } from "@/components/top10/Top10Hero";
import { formatAsOf } from "@/lib/calc/dates";
import { formatPct } from "@/lib/format";
import { readTickers, toggleTicker } from "@/lib/prefs";
import type { Top10Response, WatchItem } from "@/lib/types";
import { useMemo, useState, useEffect } from "react";

const PLACEHOLDERS = [
  { id: "deposits", title: "예·적금 TOP 5", body: "금감원 파인 API 연동 후 금리 비교를 채웁니다." },
];

export function HomeScreen({ data }: { data: Top10Response }) {
  const [tickers, setTickers] = useState<WatchItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setTickers(readTickers());
  }, []);

  const live = data.source === "krx";
  const asOfLabel = formatAsOf(data.asOf);

  const watchedCodes = useMemo(() => new Set(tickers.map((ticker) => ticker.code)), [tickers]);

  function onToggle(item: { code: string; name: string }) {
    const result = toggleTicker({ code: item.code, name: item.name });
    setTickers(result.tickers);
    setNotice(result.error ?? null);
  }

  return (
    <RequireAuth mode="app">
      <AppHeader />
      <main className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 md:px-10">
        <section className="rounded-md border border-line bg-card px-4 py-4">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
            <span className="bg-navy/10 px-2 py-0.5 font-semibold text-navy">ISSUE NO. 2026-W41</span>
            <span>{asOfLabel} KRX 장마감 기준</span>
            <span className="rounded-sm border border-sky/30 bg-sky/10 px-1.5 py-0.5 font-sans text-[0.6875rem] font-semibold text-sky">
              AI 요약은 Phase 4
            </span>
          </div>
          <h1 className="mt-2 font-serif text-[1.75rem] leading-snug font-semibold text-navy">
            거래량 변동으로 본 이번 주 관심도
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            {live
              ? "순위는 KRX 일별 시세의 거래량 변동계수로 계산했습니다. 이슈 문장은 아직 만들지 않습니다."
              : "KRX 시세를 쓰지 못해 2026-10-06 목업 순위를 보여 줍니다. 아래 안내를 확인해 주세요."}
          </p>
          {data.errors.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-spike">
              {data.errors.map((error) => (
                <li key={error.source}>{error.message}</li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            disabled
            className="mt-3 rounded-md border border-line px-3 py-1.5 text-xs text-muted"
          >
            리포트 다시 생성은 Phase 4
          </button>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div id="top10" className="flex flex-col gap-3 lg:col-span-8">
            <Top10Hero data={data} watchedCodes={watchedCodes} onToggle={onToggle} notice={notice} />
            <ThemeInsight text={data.themeInsight} />
          </div>
          <aside className="rounded-md border border-[#E5E0D8] bg-[#FDFCF9] p-4 lg:col-span-4">
            <div className="border-y border-line py-2">
              <h2 className="font-serif text-xl text-navy">이번 주 3줄 요약</h2>
            </div>
            <ul className="mt-3 space-y-3 text-sm leading-relaxed">
              <li>금리·환율 요약은 ECOS 연동 후 이 자리에 옵니다.</li>
              <li>관심 종목 등락은 위 TOP10 카드의 종가·등락률과 같습니다.</li>
              <li>다음 주 일정은 리포트 생성(Phase 4) 후 표시합니다.</li>
            </ul>
            <p className="mt-4 font-mono text-[0.6875rem] text-muted">
              {live ? "시세는 KRX · 문장 요약은 Phase 4" : "모델 호출 없음"}
            </p>
          </aside>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article id="watchlist" className="rounded-md border border-line bg-card p-4">
            <h2 className="text-base font-bold">내 관심 종목</h2>
            {tickers.length === 0 ? (
              <p className="mt-3 text-sm text-muted">담긴 종목이 없습니다. 카드의 ☆로 추가할 수 있습니다.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {tickers.map((ticker) => {
                  const hit = data.items.find((item) => item.code === ticker.code);
                  return (
                    <li key={ticker.code} className="flex items-center justify-between py-2 text-sm">
                      <span>
                        <span className="font-semibold">{ticker.name}</span>
                        <span className="ml-2 font-mono text-xs text-muted">{ticker.code}</span>
                        {hit ? (
                          <span className="ml-2 text-[0.6875rem] font-semibold text-navy">내 관심 종목 · TOP{hit.rank}</span>
                        ) : null}
                      </span>
                      <button type="button" className="text-xs text-muted underline" onClick={() => onToggle(ticker)}>
                        빼기
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
          <article id="disclosures" className="rounded-md border border-line bg-card p-4">
            <h2 className="text-base font-bold">최근 공시</h2>
            <p className="mt-1 text-xs text-muted">DART · {asOfLabel} 기준 최근 7일 · TOP10 종목</p>
            {data.disclosures.length === 0 ? (
              <p className="mt-3 text-sm text-muted">이 기간에 조회된 공시가 없습니다.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {data.disclosures.map((item) => (
                  <li key={item.rceptNo} className="py-2 text-sm">
                    <a
                      className="font-semibold text-navy hover:underline"
                      href={`https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rceptNo}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.reportName}
                    </a>
                    <p className="text-xs text-muted">
                      {item.corpName} · {item.stockCode} · {formatAsOf(item.rceptDt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>
            <article id="market" className="rounded-md border border-line bg-card p-4">
            <h2 className="text-base font-bold">KRX 지수</h2>
            {data.indices.length === 0 ? (
              <p className="mt-3 text-sm text-muted">KRX 시리즈 일별시세가 없습니다.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {data.indices.map((index) => (
                  <li key={index.name} className="flex items-baseline justify-between py-2 text-sm">
                    <span className="font-semibold">{index.name}</span>
                    <span className="num text-right">
                      <span className="block font-semibold">{index.close.toLocaleString("ko-KR")}</span>
                      <span className={index.changePct >= 0 ? "text-up" : "text-down"}>{formatPct(index.changePct)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
            {PLACEHOLDERS.map((block) => (
            <article key={block.id} id={block.id} className="rounded-md border border-dashed border-line bg-card p-4">
              <h2 className="text-base font-bold">{block.title}</h2>
              <p className="mt-2 text-sm text-muted">{block.body}</p>
              <p className="mt-3 font-mono text-[0.6875rem] text-muted">연동 전</p>
            </article>
          ))}
        </section>
        <Disclaimer />
      </main>
    </RequireAuth>
  );
}
