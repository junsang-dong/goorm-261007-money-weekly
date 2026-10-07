import { Soon } from "@/components/Soon";

export default async function StockPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <Soon
      title="종목 상세"
      body={`${code}의 30일 거래량·주가 차트, 이슈 해설, 공시는 Phase 2 이후입니다. 관심도 순위와 거래량은 메인 화면 목업을 봐 주세요.`}
    />
  );
}
