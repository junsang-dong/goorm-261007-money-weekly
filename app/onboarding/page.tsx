import { OnboardingForm } from "@/components/OnboardingForm";
import { getTop10 } from "@/lib/top10/load";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  return <OnboardingForm items={(await getTop10()).items} />;
}
