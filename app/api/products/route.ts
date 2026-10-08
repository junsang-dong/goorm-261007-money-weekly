import { getProducts } from "@/lib/sources/finlife";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("type") === "saving" ? "saving" : "deposit";
  const group = url.searchParams.get("group") ?? "020000";
  const term = Number(url.searchParams.get("term") ?? "12");
  return NextResponse.json(await getProducts({ kind, group, term }));
}
