import { getTop10 } from "@/lib/top10/load";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const view = new URL(request.url).searchParams.get("view") === "week" ? "week" : "day";
  const data = await getTop10();
  return NextResponse.json({ ...data, view });
}
