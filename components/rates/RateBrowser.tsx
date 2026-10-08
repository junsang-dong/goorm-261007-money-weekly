"use client";

import { AppHeader } from "@/components/AppHeader";
import { Disclaimer } from "@/components/Disclaimer";
import { RequireAuth } from "@/components/RequireAuth";
import type { ProductsResponse } from "@/lib/types";
import { useEffect, useState } from "react";

const GROUPS = [
  { id: "020000", label: "은행" },
  { id: "030300", label: "저축은행" },
  { id: "050000", label: "보험" },
  { id: "060000", label: "금융투자" },
];

export function RateBrowser({ initial }: { initial: ProductsResponse }) {
  const [kind, setKind] = useState<"deposit" | "saving">("deposit");
  const [group, setGroup] = useState("020000");
  const [term, setTerm] = useState(12);
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/products?type=${kind}&group=${group}&term=${term}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((body: ProductsResponse) => setData(body))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setData({ products: [], sources: [], errors: [{ source: "finlife", message: "금리 표를 불러오지 못했습니다." }] });
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [kind, group, term]);

  return (
    <RequireAuth mode="app">
      <AppHeader />
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 md:px-10">
        <header>
          <h1 className="font-serif text-3xl text-navy">예·적금 비교</h1>
          <p className="mt-2 text-sm text-muted">최고금리(우대 포함)가 높은 순입니다. 가입을 권하지 않습니다.</p>
        </header>
        <div className="flex flex-wrap gap-2 text-sm">
          {(["deposit", "saving"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setKind(value)}
              className={`rounded-md border px-3 py-1.5 ${kind === value ? "border-navy bg-navy text-white" : "border-line bg-card"}`}
            >
              {value === "deposit" ? "정기예금" : "적금"}
            </button>
          ))}
          {GROUPS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setGroup(item.id)}
              className={`rounded-md border px-3 py-1.5 ${group === item.id ? "border-blue text-blue" : "border-line bg-card"}`}
            >
              {item.label}
            </button>
          ))}
          {[6, 12, 24, 36].map((months) => (
            <button
              key={months}
              type="button"
              onClick={() => setTerm(months)}
              className={`rounded-md border px-3 py-1.5 ${term === months ? "border-blue text-blue" : "border-line bg-card"}`}
            >
              {months}개월
            </button>
          ))}
        </div>
        {loading ? <p className="text-sm text-muted">금리를 불러오는 중…</p> : null}
        {data.errors.map((error) => (
          <p key={error.message} className="text-sm text-spike">
            {error.message}
          </p>
        ))}
        {data.products.length === 0 ? (
          <p className="text-sm text-muted">표시할 상품이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-line bg-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">금융회사</th>
                  <th className="px-3 py-2 font-medium">상품</th>
                  <th className="px-3 py-2 font-medium">금리 유형</th>
                  <th className="px-3 py-2 text-right font-medium">기본금리</th>
                  <th className="px-3 py-2 text-right font-medium">최고금리</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((product) => (
                  <tr key={product.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2">{product.company}</td>
                    <td className="px-3 py-2 font-semibold">{product.name}</td>
                    <td className="px-3 py-2 text-muted">{product.rateType}</td>
                    <td className="num px-3 py-2 text-right">{product.baseRate.toFixed(2)}%</td>
                    <td className="num px-3 py-2 text-right font-semibold text-navy">{product.maxRate.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.sources.length > 0 ? <p className="font-mono text-[0.6875rem] text-muted">{data.sources.join(" · ")}</p> : null}
        <Disclaimer />
      </main>
    </RequireAuth>
  );
}
