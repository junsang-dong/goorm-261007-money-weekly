"use client";

import { AppHeader } from "@/components/AppHeader";
import { Disclaimer } from "@/components/Disclaimer";
import { RequireAuth } from "@/components/RequireAuth";
import { VolumeChart } from "@/components/top10/VolumeChart";
import { formatAsOf } from "@/lib/calc/dates";
import { formatMarketCap, formatPct, formatPrice, formatVolume } from "@/lib/format";
import { readTickers, toggleTicker } from "@/lib/prefs";
import type { StockDetail } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export function StockScreen({ detail }: { detail: StockDetail }) {
  const [watched, setWatched] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const priceTone =
    detail.changePct === null ? "text-muted" : detail.changePct > 0 ? "text-up" : detail.changePct < 0 ? "text-down" : "text-muted";

  useEffect(() => {
    setWatched(readTickers().some((ticker) => ticker.code === detail.code));
  }, [detail.code]);

  function onToggle() {
    const result = toggleTicker({ code: detail.code, name: detail.name });
    setWatched(result.tickers.some((ticker) => ticker.code === detail.code));
    setNotice(result.error ?? null);
  }

  return (
    <RequireAuth mode="app">
      <AppHeader />
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 md:px-10">
        <Link href="/#top10" className="text-sm text-blue">
          관심도 TOP10으로
        </Link>
        <header className="rounded-md border border-line bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-muted">
                {detail.asOf ? formatAsOf(detail.asOf) : "기준일 없음"} · {detail.market || "시장"}
              </p>
              <h1 className="mt-1 font-serif text-3xl text-navy">{detail.name}</h1>
              <p className="mt-1 text-sm text-muted">
                <span className="font-mono">{detail.code}</span>
                <span className="ml-2 rounded-sm border border-line bg-tint px-1.5 py-0.5 text-xs font-semibold text-navy">
                  {detail.theme}
                </span>
                {detail.rank ? <span className="ml-2 font-semibold text-navy">관심도 {detail.rank}위</span> : null}
              </p>
            </div>
            <button type="button" onClick={onToggle} className={`text-2xl ${watched ? "text-spike" : "text-muted"}`}>
              {watched ? "★" : "☆"}
            </button>
          </div>
          {notice ? <p className="mt-2 text-sm text-spike">{notice}</p> : null}
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <div>
              <dt className="text-xs text-muted">종가</dt>
              <dd className="num font-semibold">{detail.close === null ? "—" : formatPrice(detail.close)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">등락률</dt>
              <dd className={`num font-semibold ${priceTone}`}>{detail.changePct === null ? "—" : formatPct(detail.changePct)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">거래량</dt>
              <dd className="num font-semibold">{detail.volume === null ? "—" : formatVolume(detail.volume)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">거래대금</dt>
              <dd className="num font-semibold">—</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">시가총액</dt>
              <dd className="num font-semibold">{detail.marketCap === null ? "—" : formatMarketCap(detail.marketCap)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">관심도 점수</dt>
              <dd className="num font-semibold">{detail.score === null ? "—" : detail.score.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">30일 평균 거래량</dt>
              <dd className="num font-semibold">{detail.volumeAverage === null ? "—" : formatVolume(detail.volumeAverage)}</dd>
            </div>
          </dl>
        </header>

        <section className="rounded-md border border-line bg-card p-4">
          <h2 className="text-base font-bold">30거래일 거래량·종가</h2>
          <div className="mt-3">
            <VolumeChart points={detail.points} average={detail.volumeAverage} />
          </div>
        </section>

        <section className="rounded-md border border-line bg-card p-4">
          <h2 className="text-base font-bold">왜 관심을 받았나</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">{detail.note || "이 종목은 이번 관심도 TOP10에 없습니다."}</p>
          {detail.issue ? (
            <p className="mt-2 text-sm leading-relaxed text-ink">
              {detail.issue.oneOff ? (
                <span className="mr-1 rounded-sm bg-spike-bg px-1 py-0.5 text-[0.6875rem] font-semibold text-spike">일회성</span>
              ) : null}
              {detail.issue.text}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">확인된 뉴스 이슈는 메인 브리핑이 만들어진 뒤에 여기에 붙습니다.</p>
          )}
        </section>

        <section className="rounded-md border border-line bg-card p-4">
          <h2 className="text-base font-bold">최근 공시</h2>
          {detail.disclosures.length === 0 ? (
            <p className="mt-2 text-sm text-muted">최근 7일 공시가 없거나 아직 조회하지 못했습니다.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {detail.disclosures.map((item) => (
                <li key={item.rceptNo} className="py-2 text-sm">
                  <a
                    className="font-semibold text-navy hover:underline"
                    href={`https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rceptNo}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.reportName}
                  </a>
                  <p className="text-xs text-muted">{formatAsOf(item.rceptDt)}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted">공시 중요도 분류는 Phase 4입니다.</p>
        </section>

        <section className="rounded-md border border-line bg-card p-4">
          <h2 className="text-base font-bold">보통주·우선주</h2>
          {detail.peer ? (
            <p className="mt-2 text-sm">
              {detail.peer.relation === "preferred" ? "우선주" : "보통주"}{" "}
              <Link className="font-semibold text-navy hover:underline" href={`/stock/${detail.peer.code}`}>
                {detail.peer.name}
              </Link>
              <span className="num ml-2 text-muted">
                거래량 {formatVolume(detail.peer.volume)} · {formatPrice(detail.peer.close)}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">같은 이름의 보통주 또는 우선주를 최근 시세에서 찾지 못했습니다.</p>
          )}
        </section>

        <section className="rounded-md border border-line bg-card p-4">
          <h2 className="text-base font-bold">같은 테마 TOP10</h2>
          {detail.related.length === 0 ? (
            <p className="mt-2 text-sm text-muted">이번 TOP10 안에 같은 테마 종목이 없습니다.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {detail.related.map((item) => (
                <li key={item.code}>
                  <Link className="font-semibold text-navy hover:underline" href={`/stock/${item.code}`}>
                    {item.rank}위 {item.name}
                  </Link>
                  <span className="ml-2 font-mono text-xs text-muted">{item.code}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {detail.errors.length > 0 ? (
          <ul className="space-y-1 text-sm text-spike">
            {detail.errors.map((error) => (
              <li key={`${error.source}-${error.message}`}>{error.message}</li>
            ))}
          </ul>
        ) : null}
        <Disclaimer />
      </main>
    </RequireAuth>
  );
}
