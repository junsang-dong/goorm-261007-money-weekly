import { volumeCV } from "@/lib/calc/attention";
import { addDays, compactDate, isWeekend, isoDate, previousWeekdays, seoulToday } from "@/lib/calc/dates";
import sectorMap from "@/data/sector-map.json";
import { fetchDisclosures } from "@/lib/sources/dart";
import { fetchMarketDay, findQuote, type KrxQuote } from "@/lib/sources/krx";
import { readCachedIssue } from "@/lib/llm/briefing";
import { getTop10 } from "@/lib/top10/load";
import type { PricePoint, StockDetail, StockPeer } from "@/lib/types";

const themes = sectorMap as Record<string, string>;

function commonBase(name: string): string | null {
  const base = name.replace(/(우B|우)$/, "");
  return base === name ? null : base;
}

function peerOf(quote: KrxQuote, quotes: KrxQuote[]): StockPeer | null {
  const base = commonBase(quote.name);
  if (base) {
    const common = quotes.find((item) => item.name === base);
    if (!common) return null;
    return { code: common.code, name: common.name, close: common.close, volume: common.volume, relation: "common" };
  }
  const preferred = quotes.find((item) => item.name === `${quote.name}우` || item.name === `${quote.name}우B`);
  if (!preferred) return null;
  return {
    code: preferred.code,
    name: preferred.name,
    close: preferred.close,
    volume: preferred.volume,
    relation: "preferred",
  };
}

export async function loadPricePoints(
  code: string,
  latest?: { date: string; quotes: KrxQuote[] },
): Promise<PricePoint[]> {
  const day = latest ?? (await latestDay());
  if (!day || !findQuote(day.quotes, code)) return [];
  const dates = previousWeekdays(day.date, 40);
  const newestFirst: PricePoint[] = [];
  for (const date of dates) {
    const quotes = date === day.date ? day.quotes : await fetchMarketDay(date).catch(() => []);
    const row = findQuote(quotes, code);
    if (!row) continue;
    newestFirst.push({ date: isoDate(date), close: row.close, volume: row.volume, changePct: row.changePct });
    if (newestFirst.length >= 30) break;
  }
  return newestFirst.reverse();
}

async function latestDay(): Promise<{ date: string; quotes: KrxQuote[] } | null> {
  let cursor = compactDate(seoulToday());
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (!isWeekend(cursor)) {
      try {
        const quotes = await fetchMarketDay(cursor);
        if (quotes.length > 0) return { date: cursor, quotes };
      } catch {
        // 휴장일이거나 호출이 비면 이전 영업일로 간다.
      }
    }
    cursor = addDays(cursor, -1);
  }
  return null;
}

export async function getStockDetail(code: string): Promise<StockDetail> {
  const normalized = code.trim().toUpperCase();
  const empty: StockDetail = {
    code: normalized,
    name: normalized,
    market: "",
    asOf: "",
    close: null,
    changePct: null,
    volume: null,
    marketCap: null,
    rank: null,
    score: null,
    theme: themes[normalized] ?? "기타",
    note: "",
    points: [],
    volumeAverage: null,
    disclosures: [],
    peer: null,
    issue: null,
    related: [],
    sources: [],
    errors: [],
  };

  if (!/^[0-9A-Z]{6}$/.test(normalized)) {
    empty.errors.push({ source: "krx", message: "종목코드는 6자리여야 합니다." });
    return empty;
  }

  const top10 = await getTop10();
  const ranked = top10.items.find((item) => item.code === normalized);
  empty.theme = ranked?.theme ?? empty.theme;
  empty.note = ranked?.note ?? "";
  empty.rank = ranked?.rank ?? null;
  empty.score = ranked?.score ?? null;
  empty.related = top10.items
    .filter((item) => item.code !== normalized && item.theme === empty.theme && item.theme !== "기타")
    .map((item) => ({ code: item.code, name: item.name, rank: item.rank, theme: item.theme }));

  const latest = await latestDay();
  if (!latest) {
    empty.errors.push({ source: "krx", message: "최근 영업일 시세를 찾지 못했습니다." });
    if (ranked) {
      empty.name = ranked.name;
      empty.asOf = top10.asOf;
      empty.close = ranked.closePrice;
      empty.changePct = ranked.priceChangePct;
      empty.volume = ranked.volume;
    }
    return empty;
  }

  const quote = findQuote(latest.quotes, normalized);
  if (!quote) {
    empty.errors.push({ source: "krx", message: "이 종목은 최근 유가증권 시세에 없습니다. 코스닥은 이용 승인이 없어 빠질 수 있습니다." });
    if (ranked) empty.name = ranked.name;
    return empty;
  }

  const points = await loadPricePoints(normalized, latest);

  const volumes = points.map((point) => point.volume);
  empty.name = quote.name;
  empty.market = quote.market;
  empty.asOf = isoDate(latest.date);
  empty.close = quote.close;
  empty.changePct = quote.changePct;
  empty.volume = quote.volume;
  empty.marketCap = quote.marketCap;
  empty.points = points;
  empty.volumeAverage = volumes.length > 0 ? volumes.reduce((sum, volume) => sum + volume, 0) / volumes.length : null;
  empty.peer = peerOf(quote, latest.quotes);
  empty.score = volumes.length >= 5 ? Number(volumeCV(volumes).toFixed(4)) : empty.score;
  if (!empty.note && empty.score !== null) {
    empty.note = `${points.length}거래일 거래량 변동계수 ${empty.score.toFixed(2)}. 이 숫자는 거래량이 평소보다 얼마나 출렁였는지이며 주가 상승을 뜻하지 않습니다.`;
  }
  empty.issue = await readCachedIssue(empty.asOf, normalized);
  empty.sources.push("KRX OPEN API 유가증권 일별매매정보");

  if (!process.env.DART_API_KEY?.trim()) {
    empty.errors.push({ source: "dart", message: "DART_API_KEY가 없어 공시를 조회하지 않았습니다." });
  } else if (/[A-Z]/.test(normalized)) {
    empty.errors.push({ source: "dart", message: "영문이 섞인 단축코드는 DART 기업코드 매핑에서 빠집니다." });
  } else {
    try {
      empty.disclosures = await fetchDisclosures([normalized], latest.date);
      empty.sources.push("DART 오픈API 공시검색");
    } catch (error) {
      empty.errors.push({
        source: "dart",
        message: error instanceof Error ? error.message : "공시를 가져오지 못했습니다.",
      });
    }
  }

  return empty;
}
