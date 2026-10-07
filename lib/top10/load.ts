import { compactDate } from "@/lib/calc/dates";
import { fetchDisclosures } from "@/lib/sources/dart";
import { getMockTop10 } from "@/lib/top10/mock";
import { buildTop10FromKrx, KrxAuthError } from "@/lib/top10/engine";
import type { Top10Response } from "@/lib/types";

export async function getTop10(): Promise<Top10Response> {
  const source = (process.env.TOP10_SOURCE ?? "mock").trim();
  let data: Top10Response;

  if (source === "krx") {
    try {
      data = await buildTop10FromKrx();
    } catch (error) {
      data = getMockTop10();
      const message =
        error instanceof KrxAuthError
          ? error.message
          : error instanceof Error
            ? error.message
            : "KRX 시세를 가져오지 못했습니다.";
      data.errors = [{ source: "krx", message: `${message} 순위는 2026-10-06 목업을 유지합니다.` }];
    }
  } else {
    data = getMockTop10();
  }

  if (!process.env.DART_API_KEY?.trim()) return data;

  try {
    data.disclosures = await fetchDisclosures(
      data.items.map((item) => item.code),
      compactDate(data.asOf),
    );
    if (!data.sources.includes("DART 오픈API 공시검색")) data.sources.push("DART 오픈API 공시검색");
  } catch (error) {
    data.errors.push({
      source: "dart",
      message: error instanceof Error ? error.message : "DART 공시를 가져오지 못했습니다.",
    });
  }

  return data;
}
