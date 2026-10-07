import type { AssetId, WatchItem } from "@/lib/types";

export const PREF_KEYS = {
  assets: "mw.assets",
  tickers: "mw.tickers",
  onboarded: "mw.onboarded",
} as const;

export const ASSET_OPTIONS: { id: AssetId; label: string; hint: string }[] = [
  { id: "savings", label: "예·적금", hint: "금리와 최고 금리 상품" },
  { id: "stock", label: "국내 주식", hint: "관심도 TOP10과 관심 종목" },
  { id: "insurance", label: "보험·연금", hint: "연금저축과 보험 소식" },
];

const MAX_TICKERS = 10;

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function notify() {
  window.dispatchEvent(new Event("mw-prefs"));
}

export function readAssets(): AssetId[] {
  return readJson<AssetId[]>(PREF_KEYS.assets, []);
}

export function writeAssets(assets: AssetId[]) {
  localStorage.setItem(PREF_KEYS.assets, JSON.stringify(assets));
  notify();
}

export function readTickers(): WatchItem[] {
  return readJson<WatchItem[]>(PREF_KEYS.tickers, []);
}

export function writeTickers(tickers: WatchItem[]) {
  localStorage.setItem(PREF_KEYS.tickers, JSON.stringify(tickers));
  notify();
}

export function isOnboarded(): boolean {
  return localStorage.getItem(PREF_KEYS.onboarded) === "1";
}

export function markOnboarded() {
  localStorage.setItem(PREF_KEYS.onboarded, "1");
  notify();
}

export function clearPrefs() {
  localStorage.removeItem(PREF_KEYS.assets);
  localStorage.removeItem(PREF_KEYS.tickers);
  localStorage.removeItem(PREF_KEYS.onboarded);
  notify();
}

export function toggleTicker(item: WatchItem): { tickers: WatchItem[]; error?: string } {
  const current = readTickers();
  if (current.some((ticker) => ticker.code === item.code)) {
    const next = current.filter((ticker) => ticker.code !== item.code);
    writeTickers(next);
    return { tickers: next };
  }
  if (current.length >= MAX_TICKERS) {
    return { tickers: current, error: "관심 종목은 10개까지 담을 수 있습니다." };
  }
  const next = [...current, item];
  writeTickers(next);
  return { tickers: next };
}
