import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DepositProduct, ProductsResponse } from "@/lib/types";

const CACHE_DIR = path.join(process.cwd(), ".cache", "finlife");
const CACHE_MS = 24 * 60 * 60 * 1000;

const GROUPS: Record<string, string> = {
  "020000": "은행",
  "030300": "저축은행",
  "050000": "보험",
  "060000": "금융투자",
};

type BaseRow = { fin_co_no?: string; fin_prdt_cd?: string; kor_co_nm?: string; fin_prdt_nm?: string };
type OptionRow = {
  fin_co_no?: string;
  fin_prdt_cd?: string;
  save_trm?: string;
  intr_rate?: number | string | null;
  intr_rate2?: number | string | null;
  intr_rate_type_nm?: string;
};

function rateOf(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readCache(file: string): Promise<ProductsResponse | null> {
  try {
    const raw = JSON.parse(await readFile(file, "utf8")) as { savedAt: number; body: ProductsResponse };
    if (Date.now() - raw.savedAt > CACHE_MS) return null;
    return raw.body;
  } catch {
    return null;
  }
}

export async function getProducts(input: {
  kind: "deposit" | "saving";
  group: string;
  term: number;
}): Promise<ProductsResponse> {
  const key = process.env.FINLIFE_API_KEY?.trim();
  if (!key) {
    return {
      products: [],
      sources: [],
      errors: [{ source: "finlife", message: "FINLIFE_API_KEY가 없어 예·적금 금리를 조회하지 않았습니다." }],
    };
  }

  const group = GROUPS[input.group] ? input.group : "020000";
  const term = [6, 12, 24, 36].includes(input.term) ? input.term : 12;
  const endpoint = input.kind === "saving" ? "savingProductsSearch.json" : "depositProductsSearch.json";
  await mkdir(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `${input.kind}-${group}-${term}.json`);
  const cached = await readCache(file);
  if (cached) return cached;

  const products: DepositProduct[] = [];
  const errors: ProductsResponse["errors"] = [];
  let page = 1;
  let maxPage = 1;

  while (page <= maxPage && page <= 8) {
    const params = new URLSearchParams({ auth: key, topFinGrpNo: group, pageNo: String(page) });
    const response = await fetch(`https://finlife.fss.or.kr/finlifeapi/${endpoint}?${params}`, { cache: "no-store" });
    const body = (await response.json()) as {
      result?: { err_cd?: string; err_msg?: string; max_page_no?: number; baseList?: BaseRow[]; optionList?: OptionRow[] };
    };
    const result = body.result;
    if (!response.ok || !result || (result.err_cd && result.err_cd !== "000")) {
      errors.push({ source: "finlife", message: result?.err_msg || `파인 조회 실패 (${response.status})` });
      break;
    }
    maxPage = Number(result.max_page_no) || 1;
    const names = new Map(
      (result.baseList ?? []).map((row) => [`${row.fin_co_no}:${row.fin_prdt_cd}`, row]),
    );
    for (const option of result.optionList ?? []) {
      if (Number(option.save_trm) !== term) continue;
      const base = names.get(`${option.fin_co_no}:${option.fin_prdt_cd}`);
      const baseRate = rateOf(option.intr_rate);
      const maxRate = rateOf(option.intr_rate2);
      if (!base?.fin_prdt_nm || maxRate === null) continue;
      products.push({
        id: `${option.fin_co_no}-${option.fin_prdt_cd}-${option.intr_rate_type_nm ?? ""}`,
        company: base.kor_co_nm || "금융회사",
        name: base.fin_prdt_nm,
        termMonths: term,
        baseRate: baseRate ?? maxRate,
        maxRate,
        rateType: option.intr_rate_type_nm || "",
        group: GROUPS[group],
        kind: input.kind,
      });
    }
    page += 1;
  }

  products.sort((a, b) => b.maxRate - a.maxRate || b.baseRate - a.baseRate);
  const unique: DepositProduct[] = [];
  const seen = new Set<string>();
  for (const product of products) {
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    unique.push(product);
  }

  const payload: ProductsResponse = {
    products: unique.slice(0, 30),
    sources: unique.length > 0 ? ["금융감독원 금융상품한눈에"] : [],
    errors,
  };
  if (unique.length > 0) await writeFile(file, JSON.stringify({ savedAt: Date.now(), body: payload }));
  return payload;
}
