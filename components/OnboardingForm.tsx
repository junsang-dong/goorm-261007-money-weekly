"use client";

import { AppHeader } from "@/components/AppHeader";
import { RequireAuth } from "@/components/RequireAuth";
import { ASSET_OPTIONS, markOnboarded, readAssets, readTickers, toggleTicker, writeAssets } from "@/lib/prefs";
import type { AssetId, Top10Item, WatchItem } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function OnboardingForm({ items }: { items: Top10Item[] }) {
  const router = useRouter();
  const [assets, setAssets] = useState<AssetId[]>([]);
  const [tickers, setTickers] = useState<WatchItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAssets(readAssets());
    setTickers(readTickers());
  }, []);

  function toggleAsset(id: AssetId) {
    const next = assets.includes(id) ? assets.filter((asset) => asset !== id) : [...assets, id];
    setAssets(next);
    writeAssets(next);
  }

  function toggleItem(item: Top10Item) {
    const result = toggleTicker({ code: item.code, name: item.name });
    setTickers(result.tickers);
    setError(result.error ?? null);
  }

  function finish() {
    if (assets.length === 0) {
      setError("관심 자산을 하나 이상 선택해 주세요.");
      return;
    }
    markOnboarded();
    router.replace("/");
  }

  const selected = new Set(tickers.map((ticker) => ticker.code));

  return (
    <RequireAuth mode="onboarding">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-10">
        <h1 className="font-serif text-3xl text-navy">관심 설정</h1>
        <p className="mt-2 text-sm text-muted">이 브라우저에만 저장됩니다. 서버로 보내지 않습니다.</p>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold">관심 자산</legend>
          <div className="mt-3 grid gap-2">
            {ASSET_OPTIONS.map((option) => (
              <label key={option.id} className="flex items-start gap-3 rounded-md border border-line bg-card px-3 py-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={assets.includes(option.id)}
                  onChange={() => toggleAsset(option.id)}
                />
                <span>
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="text-xs text-muted">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <section className="mt-8">
          <h2 className="text-sm font-semibold">TOP10에서 관심 종목 담기 ({tickers.length}/10)</h2>
          <ul className="mt-3 divide-y divide-line rounded-md border border-line bg-card">
            {items.map((item) => {
              const on = selected.has(item.code);
              return (
                <li key={item.code} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span>
                    <span className="font-semibold">{item.name}</span>
                    <span className="ml-2 font-mono text-xs text-muted">{item.code}</span>
                    <span className="ml-2 text-xs text-muted">{item.theme}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleItem(item)}
                    className="rounded-sm border border-line px-2 py-1 text-xs"
                  >
                    {on ? "빼기" : "담기"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {error ? <p className="mt-4 text-sm text-up">{error}</p> : null}
        <button
          type="button"
          onClick={finish}
          className="mt-6 rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-blue"
        >
          브리핑 보기
        </button>
      </main>
    </RequireAuth>
  );
}
