"use client";

import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { RequireAuth } from "@/components/RequireAuth";
import {
  ASSET_OPTIONS,
  clearPrefs,
  readAssets,
  readTickers,
  writeAssets,
  writeTickers,
} from "@/lib/prefs";
import type { AssetId, WatchItem } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SettingsPanel() {
  const { logout } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<AssetId[]>([]);
  const [tickers, setTickers] = useState<WatchItem[]>([]);

  useEffect(() => {
    setAssets(readAssets());
    setTickers(readTickers());
  }, []);

  function toggleAsset(id: AssetId) {
    const next = assets.includes(id) ? assets.filter((asset) => asset !== id) : [...assets, id];
    setAssets(next);
    writeAssets(next);
  }

  function removeTicker(code: string) {
    const next = tickers.filter((ticker) => ticker.code !== code);
    setTickers(next);
    writeTickers(next);
  }

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  function onClear() {
    if (!window.confirm("이 브라우저에 저장된 관심 자산과 종목을 지울까요?")) return;
    clearPrefs();
    router.replace("/onboarding");
  }

  return (
    <RequireAuth mode="app">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-10">
        <h1 className="font-serif text-3xl text-navy">설정</h1>
        <fieldset className="mt-6">
          <legend className="text-sm font-semibold">관심 자산</legend>
          <div className="mt-3 grid gap-2">
            {ASSET_OPTIONS.map((option) => (
              <label key={option.id} className="flex items-center gap-3 rounded-md border border-line bg-card px-3 py-2 text-sm">
                <input type="checkbox" checked={assets.includes(option.id)} onChange={() => toggleAsset(option.id)} />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <section className="mt-8">
          <h2 className="text-sm font-semibold">관심 종목</h2>
          {tickers.length === 0 ? (
            <p className="mt-2 text-sm text-muted">담긴 종목이 없습니다.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line rounded-md border border-line bg-card">
              {tickers.map((ticker) => (
                <li key={ticker.code} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>
                    {ticker.name}
                    <span className="ml-2 font-mono text-xs text-muted">{ticker.code}</span>
                  </span>
                  <button type="button" className="text-xs text-muted underline" onClick={() => removeTicker(ticker.code)}>
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={onLogout} className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white">
            로그아웃
          </button>
          <button type="button" onClick={onClear} className="rounded-md border border-line bg-card px-4 py-2 text-sm">
            저장 데이터 삭제
          </button>
        </div>
      </main>
    </RequireAuth>
  );
}
