import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type KrxQuote = {
  code: string;
  name: string;
  market: string;
  close: number;
  changePct: number;
  volume: number;
  marketCap: number;
};

type KrxRow = Record<string, string>;

const CACHE_DIR = path.join(process.cwd(), ".cache", "krx");
const memoryCache = new Map<string, KrxQuote[]>();

export class KrxAuthError extends Error {
  constructor(message = "KRX가 이 서비스 호출을 거부했습니다(401).") {
    super(message);
    this.name = "KrxAuthError";
  }
}

function authKey(): string {
  const key = process.env.KRX_AUTH_KEY?.trim();
  if (!key) throw new Error("KRX_AUTH_KEY가 없습니다.");
  return key;
}

function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function shortCode(row: KrxRow): string {
  const raw = String(row.ISU_SRT_CD || row.ISU_CD || "").trim().toUpperCase();
  if (/^[0-9A-Z]{6}$/.test(raw)) return raw;
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 6) return digits.slice(-6);
  return digits.padStart(6, "0");
}

export function findQuote(quotes: KrxQuote[], code: string): KrxQuote | undefined {
  const key = code.trim().toUpperCase();
  return quotes.find((quote) => quote.code === key);
}

function toQuote(row: KrxRow, market: string): KrxQuote | null {
  const code = shortCode(row);
  const name = row.ISU_ABBRV || row.ISU_NM;
  if (!name || code.length !== 6) return null;
  return {
    code,
    name,
    market: row.MKT_NM || market,
    close: parseNumber(row.TDD_CLSPRC),
    changePct: parseNumber(row.FLUC_RT),
    volume: parseNumber(row.ACC_TRDVOL),
    marketCap: parseNumber(row.MKTCAP),
  };
}

async function readCache(file: string): Promise<KrxQuote[] | null> {
  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as KrxQuote[];
  } catch {
    return null;
  }
}

export async function fetchKrxDaily(market: "stk" | "ksq", basDd: string): Promise<KrxQuote[]> {
  const memoryKey = `${market}-${basDd}`;
  const remembered = memoryCache.get(memoryKey);
  if (remembered) return remembered;

  await mkdir(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `${market}-${basDd}.json`);
  const cached = await readCache(file);
  if (cached) {
    memoryCache.set(memoryKey, cached);
    return cached;
  }

  const endpoint = market === "stk" ? "sto/stk_bydd_trd" : "sto/ksq_bydd_trd";
  const response = await fetch(`https://data-dbg.krx.co.kr/svc/apis/${endpoint}?basDd=${basDd}`, {
    headers: { AUTH_KEY: authKey() },
    cache: "no-store",
  });
  const body = (await response.json()) as { OutBlock_1?: KrxRow[]; respCode?: string; respMsg?: string };
  if (response.status === 401 || body.respCode === "401") throw new KrxAuthError();
  if (!response.ok) {
    throw new Error(body.respMsg || `KRX ${market} ${basDd} 호출 실패 (${response.status})`);
  }

  const label = market === "stk" ? "KOSPI" : "KOSDAQ";
  const quotes = (body.OutBlock_1 ?? [])
    .map((row) => toQuote(row, label))
    .filter((quote): quote is KrxQuote => quote !== null && quote.volume > 0 && quote.marketCap > 0);

  if (quotes.length > 0) {
    memoryCache.set(memoryKey, quotes);
    await writeFile(file, JSON.stringify(quotes));
  }
  return quotes;
}

let kosdaqDenied = false;

export function isKosdaqDenied(): boolean {
  return kosdaqDenied;
}

export async function fetchMarketDay(basDd: string): Promise<KrxQuote[]> {
  const kospi = await fetchKrxDaily("stk", basDd);
  if (kosdaqDenied) return kospi;
  try {
    const kosdaq = await fetchKrxDaily("ksq", basDd);
    return [...kospi, ...kosdaq];
  } catch (error) {
    if (error instanceof KrxAuthError) {
      kosdaqDenied = true;
      return kospi;
    }
    throw error;
  }
}

export type KrxIndexQuote = {
  name: string;
  close: number;
  changePct: number;
};

const INDEX_NAMES = ["KRX 100", "KRX 300", "KRX 반도체"];

export async function fetchKrxIndices(basDd: string): Promise<KrxIndexQuote[]> {
  await mkdir(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `idx-${basDd}.json`);
  try {
    return JSON.parse(await readFile(file, "utf8")) as KrxIndexQuote[];
  } catch {
    // 캐시가 없으면 아래에서 받아 온다.
  }

  const response = await fetch(`https://data-dbg.krx.co.kr/svc/apis/idx/krx_dd_trd?basDd=${basDd}`, {
    headers: { AUTH_KEY: authKey() },
    cache: "no-store",
  });
  const body = (await response.json()) as { OutBlock_1?: KrxRow[]; respCode?: string };
  if (!response.ok || body.respCode === "401") return [];

  const indices = (body.OutBlock_1 ?? [])
    .filter((row) => INDEX_NAMES.includes(row.IDX_NM))
    .map((row) => ({
      name: row.IDX_NM,
      close: parseNumber(row.CLSPRC_IDX),
      changePct: parseNumber(row.FLUC_RT),
    }));
  if (indices.length > 0) await writeFile(file, JSON.stringify(indices));
  return indices;
}
