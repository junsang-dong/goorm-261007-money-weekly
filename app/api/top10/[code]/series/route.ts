import { loadPricePoints } from "@/lib/top10/detail";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const normalized = code.trim().toUpperCase();
  if (!/^[0-9A-Z]{6}$/.test(normalized)) {
    return NextResponse.json({ points: [], error: "종목코드는 6자리여야 합니다." });
  }
  const points = await loadPricePoints(normalized);
  if (points.length < 2) {
    return NextResponse.json({ points, error: "30거래일 시세가 부족합니다." });
  }
  return NextResponse.json({ points });
}
