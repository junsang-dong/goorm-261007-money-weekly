import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { addDays, compactDate, seoulToday } from "@/lib/calc/dates";
import type { MarketIndicator, MarketResponse } from "@/lib/types";

const CACHE_DIR = path.join(process.cwd(), ".cache", "ecos");
const CACHE_MS = 6 * 60 * 60 * 1000;

const SERIES = [
  { id: "base-rate", name: "기준금리", stat: "722Y001", cycle: "D" as const, item: "0101000", unit: "%" },
  { id: "ktb-3y", name: "국고채 3년", stat: "817Y002", cycle: "D" as const, item: "010200000", unit: "%" },
  { id: "usdkrw", name: "원/달러", stat: "731Y001", cycle: "D" as const, item: "0000001", unit: "원" },
  { id: "cpi", name: "소비자물가", stat: "901Y009", cycle: "M" as const, item: "0", unit: "지수" },
];

type EcosRow = { TIME?: string; DATA_VALUE?: string; ITEM_NAME1?: string; UNIT_NAME?: string };

function missingKey(): MarketResponse {
  return {
    indicators: [],
    sources: [],
    errors: [{ source: "ecos", message: "ECOS_API_KEY가 없어 기준금리·국고채·원/달러·물가를 조회하지 않았습니다." }],
  };
}

async function readFreshCache(): Promise<MarketIndicator[] | null> {
  try {
    const raw = JSON.parse(await readFile(path.join(CACHE_DIR, "market.json"), "utf8")) as {
      savedAt: number;
      indicators: MarketIndicator[];
    };
    if (Date.now() - raw.savedAt > CACHE_MS) return null;
    return raw.indicators;
  } catch {
    return null;
  }
}

async function latestPoint(key: string, series: (typeof SERIES)[number]): Promise<MarketIndicator> {
  const end = compactDate(seoulToday());
  const start = series.cycle === "M" ? end.slice(0, 6) : addDays(end, -90);
  const begin = series.cycle === "M" ? addDays(end, -200).slice(0, 6) : start;
  const url = `https://ecos.bok.or.kr/api/StatisticSearch/${key}/json/kr/1/100/${series.stat}/${series.cycle}/${begin}/${series.cycle === "M" ? end.slice(0, 6) : end}/${series.item}`;
  const response = await fetch(url, { cache: "no-store" });
  const body = (await response.json()) as {
    StatisticSearch?: { row?: EcosRow[] };
    RESULT?: { CODE?: string; MESSAGE?: string };
  };
  const rows = body.StatisticSearch?.row ?? [];
  const last = rows.filter((row) => row.DATA_VALUE && row.TIME).at(-1);
  if (!response.ok || !last) {
    throw new Error(body.RESULT?.MESSAGE || `${series.name} 조회 실패 (${response.status})`);
  }
  const value = Number(last.DATA_VALUE);
  if (!Number.isFinite(value)) throw new Error(`${series.name} 값이 숫자가 아닙니다.`);
  if (series.id === "cpi" && last.ITEM_NAME1 && !last.ITEM_NAME1.includes("총")) {
    throw new Error(`소비자물가 항목이 총지수가 아닙니다(${last.ITEM_NAME1}).`);
  }
  return {
    id: series.id,
    name: series.name,
    value,
    unit: last.UNIT_NAME || series.unit,
    date: last.TIME || "",
  };
}

export async function getMarket(): Promise<MarketResponse> {
  const key = process.env.ECOS_API_KEY?.trim();
  if (!key) return missingKey();

  const cached = await readFreshCache();
  if (cached) {
    return { indicators: cached, sources: ["한국은행 ECOS"], errors: [] };
  }

  const settled = await Promise.allSettled(SERIES.map((series) => latestPoint(key, series)));
  const indicators: MarketIndicator[] = [];
  const errors: MarketResponse["errors"] = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") indicators.push(result.value);
    else {
      errors.push({
        source: "ecos",
        message: result.reason instanceof Error ? result.reason.message : `${SERIES[index].name} 조회 실패`,
      });
    }
  });

  if (indicators.length > 0) {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(path.join(CACHE_DIR, "market.json"), JSON.stringify({ savedAt: Date.now(), indicators }));
  }

  return { indicators, sources: indicators.length > 0 ? ["한국은행 ECOS"] : [], errors };
}
