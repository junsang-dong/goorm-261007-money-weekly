import { LoginPanel } from "@/components/LoginPanel";
import { getTop10 } from "@/lib/top10/load";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const data = await getTop10();
  return <LoginPanel items={data.items} asOf={data.asOf} />;
}
