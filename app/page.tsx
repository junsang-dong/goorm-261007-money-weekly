import { HomeScreen } from "@/components/HomeScreen";
import { getTop10 } from "@/lib/top10/load";

export const dynamic = "force-dynamic";

export default async function Page() {
  return <HomeScreen data={await getTop10()} />;
}
