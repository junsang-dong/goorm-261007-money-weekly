"use client";

import type { MarketResponse } from "@/lib/types";
import { useEffect, useState } from "react";

export function MarketTicker() {
  const [market, setMarket] = useState<MarketResponse | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch("/api/market")
      .then((response) => response.json() as Promise<MarketResponse>)
      .then((nextMarket) => {
        if (!ignore) setMarket(nextMarket);
      })
      .catch(() => {
        if (!ignore) setMarket({ indicators: [], sources: [], errors: [{ source: "ecos", message: "시세 티커를 불러오지 못했습니다." }] });
      });
    return () => {
      ignore = true;
    };
  }, []);

  const base = market?.indicators.find((item) => item.id === "base-rate");
  const bond = market?.indicators.find((item) => item.id === "ktb-3y");
  const fx = market?.indicators.find((item) => item.id === "usdkrw");
  const cells = [
    { label: "KOSPI", value: "지수 API 미승인" },
    { label: "KOSDAQ", value: "지수 API 미승인" },
    { label: "기준금리", value: base ? `${base.value}${base.unit === "%" ? "%" : base.unit}` : "키 없음" },
    { label: "국고채 3년", value: bond ? `${bond.value}%` : "키 없음" },
    { label: "원/달러", value: fx ? fx.value.toLocaleString("ko-KR") : "키 없음" },
  ];

  return (
    <div className="flex h-10 items-center gap-4 overflow-x-auto border-b border-line-strong bg-tint px-4 font-mono text-[0.6875rem] text-muted md:px-10">
      <span className="shrink-0 font-semibold tracking-wider">MARKET</span>
      {cells.map((cell) => (
        <span key={cell.label} className="shrink-0">
          {cell.label}
          <span className="ml-1 text-ink/80">{cell.value}</span>
        </span>
      ))}
    </div>
  );
}
