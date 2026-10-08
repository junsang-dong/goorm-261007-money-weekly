import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { addDays, compactDate } from "@/lib/calc/dates";
import { askClaude } from "@/lib/llm/anthropic";
import { asRecord, parseJson } from "@/lib/llm/json";
import { askOpenAI } from "@/lib/llm/openai";
import { askPerplexity } from "@/lib/llm/perplexity";
import { BRIEFING_SYSTEM, DISCLOSURE_SYSTEM } from "@/lib/prompts/weekly-briefing";
import { ISSUE_SEARCH_PROMPT, NEWS_SEARCH_PROMPT } from "@/lib/prompts/top10-issues";
import type {
  AssetId,
  Briefing,
  IssueNote,
  MarketResponse,
  NewsItem,
  ProductsResponse,
  StructuredDisclosure,
  Top10Response,
  WatchItem,
} from "@/lib/types";

const CACHE_DIR = path.join(process.cwd(), ".cache", "llm");
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ASSET_LABEL: Record<AssetId, string> = {
  savings: "예·적금",
  stock: "국내 주식",
  insurance: "보험·연금",
};
const TYPES = new Set(["실적", "배당", "증자·감자", "지분변동", "주요계약", "기타"]);

const regenerations = new Map<string, number[]>();

export function allowRegenerate(uid: string): boolean {
  const now = Date.now();
  const recent = (regenerations.get(uid) ?? []).filter((time) => now - time < 86_400_000);
  if (recent.length >= 3) {
    regenerations.set(uid, recent);
    return false;
  }
  recent.push(now);
  regenerations.set(uid, recent);
  return true;
}

function digest(asOf: string, assets: AssetId[], tickers: WatchItem[]): string {
  const body = `${asOf}|${[...assets].sort().join(",")}|${tickers
    .map((ticker) => ticker.code)
    .sort()
    .join(",")}`;
  return createHash("sha256").update(body).digest("hex").slice(0, 16);
}

async function readCache<T>(file: string): Promise<T | null> {
  try {
    const raw = JSON.parse(await readFile(file, "utf8")) as { savedAt: number; body: T };
    if (Date.now() - raw.savedAt > WEEK_MS) return null;
    return raw.body;
  } catch {
    return null;
  }
}

async function writeCache(file: string, body: unknown) {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(file, JSON.stringify({ savedAt: Date.now(), body }));
}

function numberList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
}

function parseIssues(value: unknown): IssueNote[] {
  const record = asRecord(value);
  const items = record?.items;
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    const row = asRecord(item);
    const code = String(row?.code ?? "").trim().toUpperCase();
    const text = String(row?.text ?? row?.issue ?? "").trim();
    if (!/^[0-9A-Z]{6}$/.test(code) || !text) return [];
    return [{ code, text, oneOff: row?.oneOff === true || text.includes("[일회성]"), citations: numberList(row?.citations) }];
  });
}

function parseNews(value: unknown): NewsItem[] {
  const record = asRecord(value);
  const items = record?.items;
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    const row = asRecord(item);
    const summary = String(row?.summary ?? "").trim();
    if (!summary) return [];
    return [{ summary, citations: numberList(row?.citations) }];
  });
}

function parseDisclosures(value: unknown): StructuredDisclosure[] {
  const record = asRecord(value);
  const items = record?.disclosures;
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    const row = asRecord(item);
    if (!row) return [];
    const type = String(row.type ?? "기타");
    const importance = row.importance === "high" || row.importance === "low" ? row.importance : "medium";
    const oneLine = String(row.one_line ?? "").trim();
    const rceptNo = String(row.rcept_no ?? "").trim();
    if (!oneLine || !rceptNo) return [];
    return [
      {
        corpName: String(row.corp_name ?? ""),
        stockCode: String(row.stock_code ?? ""),
        rceptNo,
        inTop10: row.in_top10 === true,
        type: (TYPES.has(type) ? type : "기타") as StructuredDisclosure["type"],
        importance,
        oneLine,
      },
    ];
  });
}

function summaryFromMarkdown(markdown: string): string[] {
  const section = markdown.split(/^##\s+이번 주 3줄 요약\s*$/m)[1]?.split(/^##\s+/m)[0] ?? "";
  return section
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

function unescapeJson(value: string): string {
  return value.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

function salvageBriefing(text: string): { themeInsight: string; summary: string[]; markdown: string } {
  const theme = text.match(/"themeInsight"\s*:\s*"((?:\\.|[^"\\])*)"/);
  const summaryBlock = text.match(/"summary"\s*:\s*\[([\s\S]*?)\]/);
  const summary = summaryBlock
    ? [...summaryBlock[1].matchAll(/"((?:\\.|[^"\\])*)"/g)].map((match) => unescapeJson(match[1])).filter(Boolean).slice(0, 3)
    : [];
  const markdownMatch = text.match(/"markdown"\s*:\s*"([\s\S]*)$/);
  const markdown = markdownMatch ? unescapeJson(markdownMatch[1].replace(/"\s*\}\s*$/, "").replace(/"$/, "")) : "";
  return {
    themeInsight: theme ? unescapeJson(theme[1]) : "",
    summary,
    markdown,
  };
}

function parseBriefingText(text: string): { themeInsight: string; summary: string[]; markdown: string } {
  try {
    const record = asRecord(parseJson(text));
    const summary = Array.isArray(record?.summary) ? record.summary.map((line) => String(line)).filter(Boolean).slice(0, 3) : [];
    const markdown = String(record?.markdown ?? "").trim();
    if (!markdown && summary.length === 0) throw new Error("마크다운이 없습니다.");
    return {
      themeInsight: String(record?.themeInsight ?? "").trim(),
      summary: summary.length > 0 ? summary : summaryFromMarkdown(markdown),
      markdown,
    };
  } catch {
    const salvaged = salvageBriefing(text);
    if (!salvaged.themeInsight && salvaged.summary.length === 0 && !salvaged.markdown.includes("##")) {
      throw new Error("모델 응답에서 JSON을 찾지 못했습니다.");
    }
    return salvaged;
  }
}

function payload(top10: Top10Response, market: MarketResponse, deposits: ProductsResponse, assets: AssetId[], tickers: WatchItem[], issues: IssueNote[], news: NewsItem[], disclosures: StructuredDisclosure[]) {
  return {
    asOf: top10.asOf,
    assets: assets.map((asset) => ASSET_LABEL[asset] ?? asset),
    tickers,
    indices: top10.indices,
    market: market.indicators,
    deposits: deposits.products.slice(0, 5).map((product) => ({
      company: product.company,
      name: product.name,
      termMonths: product.termMonths,
      maxRate: product.maxRate,
    })),
    items: top10.items.map((item) => ({
      rank: item.rank,
      code: item.code,
      name: item.name,
      theme: item.theme,
      closePrice: item.closePrice,
      priceChangePct: item.priceChangePct,
      volume: item.volume,
      volumeChangePct: item.volumeChangePct,
      score: item.score,
    })),
    issues,
    news,
    disclosures,
    missing: {
      market: market.indicators.length === 0,
      deposits: deposits.products.length === 0,
    },
  };
}

async function searchIssues(top10: Top10Response): Promise<{ issues: IssueNote[]; citations: string[] }> {
  const file = path.join(CACHE_DIR, `issues-${top10.asOf}.json`);
  const cached = await readCache<{ issues: IssueNote[]; citations: string[] }>(file);
  if (cached) return cached;
  const start = compactDate(top10.asOf);
  const prompt = ISSUE_SEARCH_PROMPT.replace("{start}", addDays(start, -6))
    .replace("{asOf}", start)
    .replace("{names}", top10.items.map((item) => `${item.rank}. ${item.name}(${item.code})`).join("\n"));
  const answer = await askPerplexity(prompt);
  const issues = parseIssues(parseJson(answer.text));
  if (issues.length === 0) throw new Error("이슈 수집 실패");
  const body = { issues, citations: answer.citations };
  await writeCache(file, body);
  return body;
}

async function searchNews(asOf: string, assets: AssetId[]): Promise<{ news: NewsItem[]; citations: string[] }> {
  const key = [...assets].sort().join("-") || "none";
  const file = path.join(CACHE_DIR, `news-${asOf}-${key}.json`);
  const cached = await readCache<{ news: NewsItem[]; citations: string[] }>(file);
  if (cached) return cached;
  const prompt = NEWS_SEARCH_PROMPT.replace("{asOf}", asOf).replace(
    "{assets}",
    assets.map((asset) => ASSET_LABEL[asset] ?? asset).join(", ") || "지정 없음",
  );
  const answer = await askPerplexity(prompt);
  const news = parseNews(parseJson(answer.text));
  const body = { news, citations: answer.citations };
  if (news.length > 0) await writeCache(file, body);
  return body;
}

async function structureDisclosures(top10: Top10Response): Promise<StructuredDisclosure[]> {
  if (top10.disclosures.length === 0) return [];
  const file = path.join(CACHE_DIR, `disclosures-${top10.asOf}.json`);
  const cached = await readCache<StructuredDisclosure[]>(file);
  if (cached) return cached;
  const user = JSON.stringify(
    top10.disclosures.map((item) => ({
      corp_name: item.corpName,
      stock_code: item.stockCode,
      rcept_no: item.rceptNo,
      report_nm: item.reportName,
      in_top10: top10.items.some((stock) => stock.code === item.stockCode),
    })),
  );
  let parsed: StructuredDisclosure[] = [];
  try {
    parsed = parseDisclosures(parseJson(await askOpenAI(DISCLOSURE_SYSTEM, user, "disclosures")));
  } catch {
    parsed = parseDisclosures(parseJson(await askClaude(DISCLOSURE_SYSTEM, user)));
  }
  if (parsed.length > 0) await writeCache(file, parsed);
  return parsed;
}

async function writeReport(input: unknown): Promise<{ themeInsight: string; summary: string[]; markdown: string; model: string; fallback?: string }> {
  const user = JSON.stringify(input);
  try {
    const text = await askClaude(BRIEFING_SYSTEM, user);
    return { ...parseBriefingText(text), model: "Anthropic" };
  } catch (error) {
    const text = await askOpenAI(BRIEFING_SYSTEM, user);
    return {
      ...parseBriefingText(text),
      model: "OpenAI",
      fallback: error instanceof Error ? error.message : "Claude 작성 실패",
    };
  }
}

export async function readCachedIssue(asOf: string, code: string): Promise<IssueNote | null> {
  const cached = await readCache<{ issues: IssueNote[] }>(path.join(CACHE_DIR, `issues-${asOf}.json`));
  return cached?.issues.find((issue) => issue.code === code) ?? null;
}

export async function buildBriefing(input: {
  top10: Top10Response;
  market: MarketResponse;
  deposits: ProductsResponse;
  assets: AssetId[];
  tickers: WatchItem[];
  regenerate: boolean;
}): Promise<Briefing> {
  const assets = input.assets.filter((asset) => asset in ASSET_LABEL);
  const tickers = input.tickers.filter((ticker) => /^[0-9A-Z]{6}$/i.test(ticker.code)).slice(0, 10);
  const file = path.join(CACHE_DIR, `report-${digest(input.top10.asOf, assets, tickers)}.json`);
  if (!input.regenerate) {
    const cached = await readCache<Briefing>(file);
    if (cached) return { ...cached, cached: true };
  }

  const errors: Briefing["errors"] = [];
  const sources: string[] = [];
  let issues: IssueNote[] = [];
  let news: NewsItem[] = [];
  let citationUrls: string[] = [];
  let structured: StructuredDisclosure[] = [];

  const [issueResult, newsResult, disclosureResult] = await Promise.allSettled([
    searchIssues(input.top10),
    searchNews(input.top10.asOf, assets),
    structureDisclosures(input.top10),
  ]);

  if (issueResult.status === "fulfilled") {
    issues = issueResult.value.issues;
    citationUrls = issueResult.value.citations;
    sources.push("Perplexity");
  } else {
    errors.push({ source: "perplexity", message: issueResult.reason instanceof Error ? issueResult.reason.message : "이슈 수집 실패" });
  }
  if (newsResult.status === "fulfilled") {
    news = newsResult.value.news;
    citationUrls = [...citationUrls, ...newsResult.value.citations.filter((url) => !citationUrls.includes(url))];
    if (news.length > 0 && !sources.includes("Perplexity")) sources.push("Perplexity");
  } else {
    errors.push({ source: "perplexity", message: newsResult.reason instanceof Error ? newsResult.reason.message : "주간 뉴스 수집 실패" });
  }
  if (disclosureResult.status === "fulfilled") {
    structured = disclosureResult.value;
    if (structured.length > 0) sources.push("공시 분류");
  } else {
    errors.push({
      source: "openai",
      message: disclosureResult.reason instanceof Error ? disclosureResult.reason.message : "공시 분류 실패",
    });
  }

  let themeInsight = input.top10.themeInsight;
  let summary: string[] = [];
  let markdown = "";
  try {
    const report = await writeReport(payload(input.top10, input.market, input.deposits, assets, tickers, issues, news, structured));
    if (report.themeInsight) themeInsight = report.themeInsight;
    summary = report.summary;
    markdown = report.markdown;
    sources.push(report.model);
    if (report.fallback) errors.push({ source: "anthropic", message: report.fallback });
  } catch (error) {
    errors.push({ source: "anthropic", message: error instanceof Error ? error.message : "브리핑 작성 실패" });
  }

  const briefing: Briefing = {
    asOf: input.top10.asOf,
    themeInsight,
    summary,
    issues,
    news,
    structuredDisclosures: structured,
    markdown,
    citationUrls,
    sources,
    errors,
    cached: false,
  };
  if (markdown) await writeCache(file, briefing);
  return briefing;
}
