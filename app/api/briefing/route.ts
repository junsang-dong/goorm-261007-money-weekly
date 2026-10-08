import { allowRegenerate, buildBriefing } from "@/lib/llm/briefing";
import { getMarket } from "@/lib/sources/ecos";
import { getProducts } from "@/lib/sources/finlife";
import { getTop10 } from "@/lib/top10/load";
import type { AssetId, WatchItem } from "@/lib/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ASSETS = new Set<AssetId>(["savings", "stock", "insurance"]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    assets?: unknown;
    tickers?: unknown;
    regenerate?: unknown;
    uid?: unknown;
  };
  const assets = Array.isArray(body.assets) ? body.assets.filter((asset): asset is AssetId => typeof asset === "string" && ASSETS.has(asset as AssetId)) : [];
  const tickers = Array.isArray(body.tickers)
    ? body.tickers.flatMap((ticker) => {
        if (!ticker || typeof ticker !== "object") return [];
        const row = ticker as { code?: unknown; name?: unknown };
        if (typeof row.code !== "string" || typeof row.name !== "string") return [];
        return [{ code: row.code.toUpperCase(), name: row.name.slice(0, 40) } satisfies WatchItem];
      })
    : [];
  const regenerate = body.regenerate === true;
  const uid = typeof body.uid === "string" && body.uid.trim() ? body.uid.trim().slice(0, 80) : "local";
  if (regenerate && !allowRegenerate(uid)) {
    return NextResponse.json({ error: "다시 생성은 하루 3회까지입니다." }, { status: 429 });
  }

  const [top10, market, deposits] = await Promise.all([
    getTop10(),
    getMarket(),
    getProducts({ kind: "deposit", group: "020000", term: 12 }),
  ]);
  const briefing = await buildBriefing({ top10, market, deposits, assets, tickers, regenerate });
  return NextResponse.json(briefing);
}
