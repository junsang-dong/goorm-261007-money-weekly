import { HomeScreen } from "@/components/HomeScreen";
import { getMarket } from "@/lib/sources/ecos";
import { getProducts } from "@/lib/sources/finlife";
import { getTop10 } from "@/lib/top10/load";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [data, market, deposits] = await Promise.all([
    getTop10(),
    getMarket(),
    getProducts({ kind: "deposit", group: "020000", term: 12 }),
  ]);
  return <HomeScreen data={data} market={market} deposits={deposits} />;
}
