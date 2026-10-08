import { RateBrowser } from "@/components/rates/RateBrowser";
import { getProducts } from "@/lib/sources/finlife";

export const dynamic = "force-dynamic";

export default async function RatesPage() {
  return <RateBrowser initial={await getProducts({ kind: "deposit", group: "020000", term: 12 })} />;
}
