import { getMarket } from "@/lib/sources/ecos";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getMarket());
}
