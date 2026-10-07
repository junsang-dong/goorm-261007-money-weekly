import sectorMap from "@/data/sector-map.json";
import top10File from "@/data/mock/top10-20261006.json";
import type { Top10Item, Top10Response } from "@/lib/types";

const themes = sectorMap as Record<string, string>;

export function getMockTop10(): Top10Response {
  const items = (top10File.items as Top10Item[]).map((item) => ({
    ...item,
    closePrice: item.closePrice ?? null,
    score: item.score ?? null,
    theme: themes[item.code] ?? item.theme,
  }));

  return {
    asOf: top10File.asOf,
    metric: top10File.metric,
    source: top10File.source,
    themeInsight: top10File.themeInsight,
    rankChangeNote: top10File.rankChangeNote,
    items,
    sources: [],
    errors: [],
    disclosures: [],
    indices: [],
  };
}
