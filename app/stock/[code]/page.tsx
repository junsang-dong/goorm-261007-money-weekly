import { StockScreen } from "@/components/stock/StockScreen";
import { getStockDetail } from "@/lib/top10/detail";

export const dynamic = "force-dynamic";

export default async function StockPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <StockScreen detail={await getStockDetail(code)} />;
}
