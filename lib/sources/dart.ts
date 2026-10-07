import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { addDays } from "@/lib/calc/dates";
import type { Disclosure } from "@/lib/types";

const execFileAsync = promisify(execFile);
const CACHE_DIR = path.join(process.cwd(), ".cache", "dart");

type DartListItem = {
  corp_name?: string;
  stock_code?: string;
  report_nm?: string;
  rcept_no?: string;
  rcept_dt?: string;
};

function dartKey(): string {
  const key = process.env.DART_API_KEY?.trim();
  if (!key) throw new Error("DART_API_KEY가 없습니다.");
  return key;
}

async function corpMap(): Promise<Record<string, string>> {
  await mkdir(CACHE_DIR, { recursive: true });
  const xmlPath = path.join(CACHE_DIR, "CORPCODE.xml");
  try {
    await readFile(xmlPath, "utf8");
  } catch {
    const response = await fetch(`https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${dartKey()}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`DART 기업코드 파일 다운로드 실패 (${response.status})`);
    const zipPath = path.join(CACHE_DIR, "corpCode.zip");
    await writeFile(zipPath, Buffer.from(await response.arrayBuffer()));
    await execFileAsync("unzip", ["-o", zipPath, "-d", CACHE_DIR]);
  }

  const xml = await readFile(xmlPath, "utf8");
  const map: Record<string, string> = {};
  for (const block of xml.split("<list>")) {
    const corp = block.match(/<corp_code>(\d+)<\/corp_code>/);
    const stock = block.match(/<stock_code>(\d{6})<\/stock_code>/);
    if (corp && stock) map[stock[1]] = corp[1];
  }
  return map;
}

async function listForCorp(corpCode: string, begin: string, end: string): Promise<DartListItem[]> {
  const params = new URLSearchParams({
    crtfc_key: dartKey(),
    corp_code: corpCode,
    bgn_de: begin,
    end_de: end,
    page_count: "20",
    page_no: "1",
  });
  const response = await fetch(`https://opendart.fss.or.kr/api/list.json?${params}`, { cache: "no-store" });
  const body = (await response.json()) as { status?: string; message?: string; list?: DartListItem[] };
  if (body.status === "013") return [];
  if (!response.ok || (body.status && body.status !== "000")) {
    throw new Error(body.message || `DART 공시 조회 실패 (${body.status ?? response.status})`);
  }
  return body.list ?? [];
}

export async function fetchDisclosures(stockCodes: string[], asOfCompact: string): Promise<Disclosure[]> {
  const map = await corpMap();
  const begin = addDays(asOfCompact, -7);
  const batches = await Promise.all(
    stockCodes.map(async (code) => {
      const corpCode = map[code];
      if (!corpCode) return [];
      const rows = await listForCorp(corpCode, begin, asOfCompact);
      return rows
        .filter((row) => row.rcept_no && row.report_nm)
        .map((row) => ({
          corpName: row.corp_name || code,
          stockCode: row.stock_code || code,
          reportName: row.report_nm || "",
          rceptNo: row.rcept_no || "",
          rceptDt: row.rcept_dt || "",
        }));
    }),
  );
  return batches
    .flat()
    .sort((a, b) => b.rceptDt.localeCompare(a.rceptDt))
    .slice(0, 20);
}
