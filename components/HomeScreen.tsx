"use client";

import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { Disclaimer } from "@/components/Disclaimer";
import { ReportView } from "@/components/ReportView";
import { RequireAuth } from "@/components/RequireAuth";
import { ThemeInsight } from "@/components/top10/ThemeInsight";
import { Top10Hero } from "@/components/top10/Top10Hero";
import { formatAsOf } from "@/lib/calc/dates";
import { formatPct } from "@/lib/format";
import { readAssets, readTickers, toggleTicker } from "@/lib/prefs";
import type { Briefing, MarketResponse, ProductsResponse, Top10Response, WatchItem } from "@/lib/types";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

export function HomeScreen({
  data,
  market,
  deposits,
}: {
  data: Top10Response;
  market: MarketResponse;
  deposits: ProductsResponse;
}) {
  const { user } = useAuth();
  const [tickers, setTickers] = useState<WatchItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingState, setBriefingState] = useState<"idle" | "loading" | "ready">("idle");
  const [regenNote, setRegenNote] = useState<string | null>(null);

  useEffect(() => {
    setTickers(readTickers());
  }, []);

  const live = data.source === "krx";
  const asOfLabel = formatAsOf(data.asOf);

  const watchedCodes = useMemo(() => new Set(tickers.map((ticker) => ticker.code)), [tickers]);

  async function loadBriefing(regenerate: boolean) {
    setBriefingState("loading");
    setRegenNote(null);
    try {
      const response = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assets: readAssets(),
          tickers: readTickers(),
          regenerate,
          uid: user?.uid ?? "local",
        }),
      });
      const body = (await response.json()) as Briefing & { error?: string };
      if (!response.ok) {
        setRegenNote(body.error || "브리핑을 만들지 못했습니다.");
        setBriefingState(briefing ? "ready" : "idle");
        return;
      }
      setBriefing(body);
      setBriefingState("ready");
    } catch {
      setRegenNote("브리핑을 만들지 못했습니다.");
      setBriefingState(briefing ? "ready" : "idle");
    }
  }

  useEffect(() => {
    void loadBriefing(false);
    // 첫 화면에서 저장된 관심 종목으로 한 번만 만든다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              {briefing?.markdown ? "AI가 공개 데이터를 바탕으로 작성" : "AI 요약 준비"}
            </span>
          </div>
          <h1 className="mt-2 font-serif text-[1.75rem] leading-snug font-semibold text-navy">
            거래량 변동으로 본 이번 주 관심도
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            {live
              ? "순위는 KRX 일별 시세의 거래량 변동계수로 계산했습니다. 이슈 문장은 검색 결과가 있을 때만 붙입니다."
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
            disabled={briefingState === "loading"}
            onClick={() => void loadBriefing(true)}
            className="mt-3 rounded-md border border-line px-3 py-1.5 text-xs text-navy disabled:text-muted"
          >
            {briefingState === "loading" ? "브리핑을 만드는 중…" : "리포트 다시 생성"}
          </button>
          {regenNote ? <p className="mt-2 text-sm text-spike">{regenNote}</p> : null}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div id="top10" className="flex flex-col gap-3 lg:col-span-8">
            <Top10Hero
              data={data}
              watchedCodes={watchedCodes}
              onToggle={onToggle}
              notice={notice}
              issues={briefing?.issues}
            />
            <ThemeInsight text={briefing?.themeInsight || data.themeInsight} generated={Boolean(briefing?.markdown)} />
          </div>
          <aside className="rounded-md border border-[#E5E0D8] bg-[#FDFCF9] p-4 lg:col-span-4">
            <div className="border-y border-line py-2">
              <h2 className="font-serif text-xl text-navy">이번 주 3줄 요약</h2>
            </div>
            {briefing?.summary.length ? (
              <ul className="mt-3 space-y-3 text-sm leading-relaxed">
                {briefing.summary.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">
                {briefingState === "loading" ? "3줄 요약을 만드는 중입니다." : "아직 3줄 요약이 없습니다."}
              </p>
            )}
            {market.indicators.length > 0 ? (
              <ul className="mt-3 divide-y divide-line">
                {market.indicators.map((item) => (
                  <li key={item.id} className="flex justify-between py-1.5 text-sm">
                    <span>{item.name}</span>
                    <span className="num font-semibold">
                      {item.value.toLocaleString("ko-KR")}
                      {item.unit === "%" ? "%" : ` ${item.unit}`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">{market.errors[0]?.message ?? "금리 원자료가 없습니다."}</p>
            )}
            <p className="mt-4 font-mono text-[0.6875rem] text-muted">
              {briefing?.sources.length ? briefing.sources.join(" · ") : live ? "시세는 KRX" : "모델 호출 없음"}
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
                {data.disclosures.map((item) => {
                  const classified = briefing?.structuredDisclosures.find((row) => row.rceptNo === item.rceptNo);
                  return (
                    <li key={item.rceptNo} className="py-2 text-sm">
                      <a
                        className="font-semibold text-navy hover:underline"
                        href={`https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rceptNo}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.reportName}
                      </a>
                      {classified ? (
                        <p className="text-xs text-ink">
                          {classified.type} · {classified.importance} · {classified.oneLine}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted">
                        {item.corpName} · {item.stockCode} · {formatAsOf(item.rceptDt)}
                      </p>
                    </li>
                  );
                })}
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
          <article id="deposits" className="rounded-md border border-line bg-card p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-base font-bold">예금 금리</h2>
              <Link href="/rates" className="text-xs font-semibold text-blue">
                비교 표
              </Link>
            </div>
            <p className="mt-1 text-xs text-muted">은행 · 정기예금 · 12개월 · 최고금리 순</p>
            {deposits.products.length === 0 ? (
              <p className="mt-3 text-sm text-muted">{deposits.errors[0]?.message ?? "표시할 상품이 없습니다."}</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {deposits.products.slice(0, 5).map((product) => (
                  <li key={product.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                    <span>
                      <span className="font-semibold">{product.name}</span>
                      <span className="ml-2 text-xs text-muted">{product.company}</span>
                    </span>
                    <span className="num shrink-0 font-semibold text-navy">{product.maxRate.toFixed(2)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
        {briefing?.markdown ? (
          <section className="rounded-md border border-line bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold">주간 브리핑</h2>
              <span className="rounded-sm border border-sky/30 bg-sky/10 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-sky">
                AI가 공개 데이터를 바탕으로 작성
              </span>
            </div>
            <ReportView markdown={briefing.markdown} citations={briefing.citationUrls} />
            {briefing.errors.length > 0 ? (
              <ul className="mt-3 space-y-1 text-xs text-spike">
                {briefing.errors.map((error) => (
                  <li key={`${error.source}-${error.message}`}>{error.message}</li>
                ))}
              </ul>
            ) : null}
            {briefing.citationUrls.length > 0 ? (
              <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-muted">
                {briefing.citationUrls.map((url) => (
                  <li key={url}>
                    <a className="hover:underline" href={url} target="_blank" rel="noreferrer">
                      {url}
                    </a>
                  </li>
                ))}
              </ol>
            ) : null}
          </section>
        ) : null}
        <Disclaimer />
      </main>
    </RequireAuth>
  );
}
