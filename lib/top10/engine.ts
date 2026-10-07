import { volumeCV } from "@/lib/calc/attention";
import { addDays, compactDate, isWeekend, isoDate, previousWeekdays, seoulToday } from "@/lib/calc/dates";
import sectorMap from "@/data/sector-map.json";
import { fetchKrxIndices, fetchMarketDay, isKosdaqDenied, KrxAuthError, type KrxQuote } from "@/lib/sources/krx";
import type { RankChange, Top10Item, Top10Response } from "@/lib/types";

const themes = sectorMap as Record<string, string>;

function envNumber(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function commonName(name: string): string | null {
  const base = name.replace(/\d*우B?$/, "");
  return base === name ? null : base;
}

async function latestTradingDay(): Promise<{ date: string; quotes: KrxQuote[] }> {
  let cursor = compactDate(seoulToday());
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (!isWeekend(cursor)) {
      const quotes = await fetchMarketDay(cursor);
      if (quotes.length > 0) return { date: cursor, quotes };
    }
    cursor = addDays(cursor, -1);
  }
  throw new Error("최근 영업일 KRX 시세를 찾지 못했습니다.");
}

async function history(asOf: string, quotes: KrxQuote[], windowDays: number): Promise<Map<string, KrxQuote[]>> {
  const byDate = new Map<string, KrxQuote[]>([[asOf, quotes]]);
  const dates = previousWeekdays(asOf, windowDays + 8).slice(1);
  let cursor = 0;
  async function worker() {
    while (cursor < dates.length) {
      const date = dates[cursor];
      cursor += 1;
      const dayQuotes = await fetchMarketDay(date);
      if (dayQuotes.length > 0) byDate.set(date, dayQuotes);
    }
  }
  await Promise.all(Array.from({ length: 4 }, () => worker()));
  const kept = [...byDate.keys()].sort().slice(-windowDays);
  return new Map(kept.map((date) => [date, byDate.get(date) ?? []]));
}

function ranked(byDate: Map<string, KrxQuote[]>, asOf: string, universeSize: number): Top10Item[] {
  const dates = [...byDate.keys()].sort();
  const latest = byDate.get(asOf);
  if (!latest) return [];
  const universe = [...latest].sort((a, b) => b.marketCap - a.marketCap).slice(0, universeSize);
  const codes = new Set(universe.map((quote) => quote.code));
  const series = new Map<string, KrxQuote[]>();
  for (const date of dates) {
    for (const quote of byDate.get(date) ?? []) {
      if (!codes.has(quote.code)) continue;
      const list = series.get(quote.code) ?? [];
      list.push(quote);
      series.set(quote.code, list);
    }
  }

  const scored = universe
    .map((quote) => {
      const points = series.get(quote.code) ?? [quote];
      const volumes = points.map((point) => point.volume);
      const previous = points.length > 1 ? points[points.length - 2] : null;
      const volumeChangePct = previous && previous.volume > 0 ? ((quote.volume - previous.volume) / previous.volume) * 100 : 0;
      return {
        quote,
        previous,
        score: volumes.length >= 5 ? volumeCV(volumes) : 0,
        volumeChangePct,
        sessions: volumes.length,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const olderDate = dates[Math.max(0, dates.length - 6)];
  const olderRanks = new Map<string, number>();
  if (olderDate && olderDate !== asOf) {
    const olderUniverse = new Set(
      [...(byDate.get(olderDate) ?? [])]
        .sort((a, b) => b.marketCap - a.marketCap)
        .slice(0, universeSize)
        .map((quote) => quote.code),
    );
    const olderScores = [...olderUniverse]
      .map((code) => {
        const volumes = dates
          .filter((date) => date <= olderDate)
          .flatMap((date) => (byDate.get(date) ?? []).filter((quote) => quote.code === code).map((quote) => quote.volume));
        return { code, score: volumes.length >= 5 ? volumeCV(volumes) : 0 };
      })
      .sort((a, b) => b.score - a.score);
    olderScores.forEach((item, index) => olderRanks.set(item.code, index + 1));
  }

  const nameToCode = new Map(latest.map((quote) => [quote.name, quote.code]));
  const items: Top10Item[] = scored.map((entry, index) => {
    const base = commonName(entry.quote.name);
    const linkedCommon = base ? nameToCode.get(base) ?? null : null;
    const previousRank = olderRanks.get(entry.quote.code);
    let rankChange: RankChange = null;
    if (previousRank === undefined) rankChange = "new";
    else if (previousRank !== index + 1) rankChange = previousRank - (index + 1);
    return {
      rank: index + 1,
      rankChange: olderRanks.size > 0 ? rankChange : null,
      name: entry.quote.name,
      code: entry.quote.code,
      volume: entry.quote.volume,
      volumeChangePct: Number(entry.volumeChangePct.toFixed(1)),
      prevVolume: entry.previous?.volume ?? 0,
      theme: themes[entry.quote.code] ?? "기타",
      note: `${entry.sessions}거래일 거래량 변동계수 ${entry.score.toFixed(2)}`,
      priceChangePct: Number(entry.quote.changePct.toFixed(2)),
      closePrice: entry.quote.close,
      score: Number(entry.score.toFixed(4)),
      isPreferred: linkedCommon !== null,
      preferredCode: null,
      commonCode: linkedCommon,
    };
  });

  for (const item of items) {
    if (!item.commonCode) continue;
    const common = items.find((candidate) => candidate.code === item.commonCode);
    if (common) common.preferredCode = item.code;
  }
  return items;
}

function themeInsight(items: Top10Item[]): string {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.theme === "기타") continue;
    counts.set(item.theme, (counts.get(item.theme) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (top.length === 0) return "이번 TOP10은 지정된 테마 맵 밖에 있는 종목입니다. 관심도는 주가 상승을 뜻하지 않습니다.";
  return `테마 분포는 ${top.map(([name, count]) => `${name} ${count}개`).join(", ")}입니다. 관심도는 거래량 변동이며 주가 상승을 뜻하지 않습니다.`;
}

export async function buildTop10FromKrx(): Promise<Top10Response> {
  const windowDays = envNumber("TOP10_WINDOW_DAYS", 30);
  const universeSize = envNumber("TOP10_UNIVERSE_SIZE", 100);
  const { date, quotes } = await latestTradingDay();
  const byDate = await history(date, quotes, windowDays);
  const items = ranked(byDate, date, universeSize);
  if (items.length === 0) throw new Error("KRX 시세로 TOP10을 만들지 못했습니다.");
  const indices = await fetchKrxIndices(date);
  const errors = isKosdaqDenied()
    ? [{ source: "krx", message: "코스닥 일별매매정보는 아직 이용 승인이 없어 유가증권 종목만 순위에 넣었습니다." }]
    : [];

  return {
    asOf: isoDate(date),
    metric: { name: "volume_volatility", window: windowDays, universe: universeSize },
    source: "krx",
    themeInsight: themeInsight(items),
    rankChangeNote: "순위 변동은 약 5거래일 전 관심도 순위와 비교한 값입니다. 과거 시세가 부족하면 비워 둡니다.",
    items,
    indices,
    sources: ["KRX OPEN API 유가증권 일별매매정보", "KRX OPEN API KRX 시리즈 일별시세정보"],
    errors,
    disclosures: [],
  };
}

export { KrxAuthError };
