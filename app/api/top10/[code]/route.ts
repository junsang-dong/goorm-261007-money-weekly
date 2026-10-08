import { getStockDetail } from "@/lib/top10/detail";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  return NextResponse.json(await getStockDetail(code));
}
