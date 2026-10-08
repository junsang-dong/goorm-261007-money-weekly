export const ISSUE_SEARCH_PROMPT = `다음 한국 상장 종목 10개 각각에 대해, {start}~{asOf} 사이 거래량이
평소보다 크게 움직인 이유가 될 만한 공개 뉴스·이벤트를 1~2문장으로 정리하라.
- 지수 리밸런싱, 공매도, 배당락 같은 일회성 수급 요인은 [일회성]으로 표시하고 oneOff를 true로 둔다.
- 근거가 없으면 text를 "확인된 이슈 없음"이라고 쓰고 추측하지 말 것.
- 종목별로 출처 번호를 citations에 붙일 것. 번호는 검색 결과 순서의 1부터 시작한다.
- 주가·거래량 숫자를 새로 만들지 말 것.
종목:
{names}
출력은 JSON만. { "items": [{ "code", "text", "oneOff", "citations": [] }] }`;

export const NEWS_SEARCH_PROMPT = `기준일 {asOf}, 관심 자산 {assets}.
이 기준일까지의 최근 7일 한국 금융 뉴스 중 개인 재테크 독자에게 필요한 것을 5~8개 골라 한 줄로 요약하라.
- 근거가 없는 내용은 쓰지 말 것.
- 각 항목에 출처 번호를 붙일 것.
- 매수·매도·가입을 권하지 말 것.
출력은 JSON만. { "items": [{ "summary", "citations": [] }] }`;
