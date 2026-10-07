# 📊 주간 재테크 브리핑 웹앱 — 기술명세서 (SPEC v1.1)

> 가칭: **머니위클리(MoneyWeekly)**
> 한국 개인 재테크 이용자(주식·예적금·보험)를 위한 AI 주간 금융 정보 웹앱
> 작성: 동준상 · 넥스트플랫폼 / 최초 작성 2026-10-07 · v1.1 갱신 2026-10-07
> 용도: 바이브코딩 입문자 레벨업 실습 프로젝트 겸 실서비스 MVP 명세

### 📝 v1.1 변경 내역

| 구분 | 변경 내용 |
|------|-----------|
| ⭐ 신규 핵심 기능 | **KRX 관심도 TOP10** — 거래량 변동성 기준 상위 10개 종목을 화면 최상단·주력 콘텐츠로 배치 (2장 신설) |
| 데이터 | 거래량 변동성 = 관심도 지표 정의, 산출식·유니버스 명세 추가 |
| 화면 | 메인(`/`) 최상단에 TOP10 히어로 영역, 종목 상세 `/stock/[code]` 신설 |
| 리포트 | 주간 브리핑 첫 섹션을 "이번 주 관심도 TOP10"으로 변경 |
| API | `GET /api/top10`, `GET /api/top10/[code]` 추가 |
| 개발 | 첨부 CSV(2026-10-06 기준)를 목업 데이터로 사용 → KRX 승인 전에도 개발 가능 |

---

## 0. 한눈에 보기

| 항목 | 결정 사항 |
|------|-----------|
| 프레임워크 | Next.js 15 (App Router) + TypeScript |
| 배포 | Vercel (Serverless / Route Handlers) |
| 인증 | Firebase Authentication — Google 로그인 |
| 데이터 저장 | **DB 없음** — 요청 시 생성 + Next.js Data Cache(재검증 캐시) + 브라우저 localStorage |
| 금융 데이터 | KRX OPEN API(핵심) · DART 오픈API · 한국은행 ECOS · 금감원 금융상품한눈에(파인) API |
| LLM | Perplexity(뉴스 검색) · GPT(구조화 추출) · Claude(최종 리포트 작성) |
| 도메인 지식 | anthropics/financial-services 스킬의 작성 규칙을 시스템 프롬프트로 이식 |
| ⭐ 핵심 기능 | **한국 증시 관심도 TOP10** (거래량 변동성 순) — 화면 최상단·리포트 첫 섹션 |
| 핵심 산출물 | 로그인 사용자별 "이번 주 재테크 브리핑" 1페이지 리포트 |

---

## 1. 제품 정의

### 1.1 문제와 목표

개인 재테크 이용자는 금리·시세·공시·예금 금리를 각기 다른 사이트(한국은행, KRX, DART, 파인)에서 따로 확인해야 하고, 특히 **"지금 시장의 관심이 어디에 몰려 있는가"**를 한눈에 파악하기 어렵다. 이 앱은 매주 한 번, 5분 안에 읽을 수 있는 주간 브리핑을 제공하되, **거래량 변동성으로 본 관심도 TOP10 종목을 출발점**으로 삼는다.

### 1.2 타깃 사용자

| 페르소나 | 관심 자산 | 이 앱에서 원하는 것 |
|----------|-----------|----------------------|
| 사회초년생 저축형 | 예·적금 | 이번 주 최고 금리 예적금, 기준금리 방향, "요즘 시장이 주목하는 종목" 상식 수준 파악 |
| 직장인 투자형 | 국내 주식·ETF | **관심도 TOP10의 순위 변화와 이유**, 관심 종목 등락, 주요 공시, 다음 주 일정 |
| 자산관리형 | 예금+주식+보험 | 금리 환경 변화와 시장 수급 흐름이 자산 전체에 주는 의미 |

### 1.3 범위 (MVP)

| 포함 ✅ | 제외 ❌ (v2 이후) |
|---------|-------------------|
| Google 로그인 | 회원 DB, 결제 |
| ⭐ **관심도 TOP10** (순위·변동·AI 해설·상세) | 실시간(장중) 순위 |
| 관심 종목·관심 자산 설정 (localStorage) | 서버 측 사용자 설정 동기화 |
| 주간 브리핑 7개 섹션 생성 | 이메일·카카오 자동 발송 |
| 예적금 금리 비교표 | 보험 상품 실시간 비교 (공개 API 부재 — 1.4 참고) |
| 데이터 출처·기준일 표시 | TOP10 순위 변동 알림(푸시) |

### 1.4 ⚠️ 보험 데이터에 대한 현실적 제약

금감원 "금융상품 한눈에" 오픈API는 **정기예금·적금·연금저축·주택담보대출·전세자금대출·개인신용대출**을 제공하며, 보험(실손·자동차 등)은 별도 사이트(보험다모아)로 분리되어 있고 공개 오픈API가 없다. 따라서 MVP의 보험 섹션은 다음으로 구성한다.

- 금감원 API의 **연금저축(보험사 상품 포함)** 수익률 데이터
- Perplexity 검색 기반 **주간 보험 관련 뉴스·제도 변경 요약** (출처 링크 필수)

---

## 2. ⭐ 핵심 기능 — KRX 관심도 TOP10

### 2.1 기능 정의

> **"이번 주 한국 증시에서 가장 많은 관심을 받은 10개 종목"**을 거래량 변동성 순으로 보여 주고, 각 종목에 왜 관심이 몰렸는지를 데이터와 AI 해설로 설명한다.

- **정렬 기준:** 거래량 변동성이 높은 순 = 시장 관심도가 높은 순
- **배치:** 메인 화면 최상단 히어로 영역 + 주간 브리핑 리포트의 첫 번째 섹션
- **연결:** TOP10 종목 → 상세 화면 → 공시·뉴스·관심 종목 추가로 이어지는 앱의 진입점

### 2.2 기준 데이터 (첨부 CSV, 2026-10-06 기준)

| 순위 | 종목명 | 코드 | 거래량(주) | 거래량 전일비 | 그날의 특징 |
|:--:|------|------|----------:|------:|------|
| 1 | SK하이닉스 | 000660 | 2,643,758 | +26.4% | MSCI 리밸런싱 영향으로 변동폭 확대 |
| 2 | 삼성전자 | 005930 | 12,671,704 | +10.2% | 9월 말 리밸런싱으로 2,100만주 이상 거래일 존재 |
| 3 | 삼성전기 | 009150 | 727,497 | +94.8% | 주가 +6.51% 급등, 거래량 폭증 |
| 4 | 삼성SDI | 006400 | 624,827 | +184.5% | 주가 +9.07%, 2차전지 수급 개선 기대 |
| 5 | LG전자 | 066570 | 1,205,268 | +229.8% | 주가 +7.87%, 가전·EV 부품 호재 |
| 6 | 삼성전자우 | 005935 | 2,364,503 | −7.5% | 우선주 특성상 일별 변동폭 큼 |
| 7 | 한화에어로스페이스 | 012450 | 134,112 | +18.0% | 방산주 수급 변동성 |
| 8 | 두산에너빌리티 | 034020 | 1,952,131 | +32.0% | 원전·발전 설비 수주 호조 |
| 9 | LG에너지솔루션 | 373220 | 438,390 | +468.0% | 주가 +5.12%, 2차전지 업황 개선 기대 |
| 10 | 삼성바이오로직스 | 207940 | 78,256 | +11.1% | 바이오 섹터 변동성 |

**이 데이터에서 읽히는 설계 포인트**
- 순위는 **거래량의 절대 크기가 아니라 변동성**으로 정해진다 → 삼성전자(1,267만 주)가 2위, 삼성바이오로직스(7.8만 주)가 10위에 함께 오른다. 화면에서 "거래량"과 "관심도 순위"를 혼동하지 않도록 두 값을 분리해 표시한다.
- 10개 중 **6개가 반도체·전자부품·2차전지** → 종목별 카드뿐 아니라 **테마 묶음 인사이트**가 핵심 콘텐츠가 된다.
- 보통주와 우선주(삼성전자/삼성전자우)가 동시에 진입 → 그룹 표시 규칙이 필요하다.
- 하루 단위로 보면 **이벤트성 요인(MSCI 리밸런싱)**이 섞인다 → 주간 관점 해설에서 일회성 요인을 구분한다.

### 2.3 관심도 지표 정의 (앱에서 재현하는 방법)

CSV는 순위 결과만 담고 있으므로, 앱이 매주 같은 방식으로 TOP10을 다시 만들 수 있도록 지표를 명시한다.

| 항목 | 정의 |
|------|------|
| 지표명 | **관심도 지수 (Volume Volatility Score)** |
| 기본 산출식 | 최근 30거래일 일별 거래량의 **변동계수(CV) = 표준편차 ÷ 평균** |
| 보조 지표 | ① 거래량 전일비(%) ② 30일 평균 대비 최근 5일 평균 비율 ③ 주가 등락률 |
| 유니버스 | 코스피·코스닥 **시가총액 상위 100종목** (설정값, `TOP10_UNIVERSE_SIZE`) |
| 우선주 | 순위 산정에는 포함, 화면에서는 보통주 카드에 "우선주도 TOP10" 배지로 연결 |
| 갱신 | 매 거래일 장 마감 후 데이터 기준(KRX는 전 영업일까지 제공) |
| 주간 뷰 | 해당 주 마지막 거래일 순위 + **지난주 대비 순위 변동(▲▼, NEW)** |

```ts
// lib/calc/attention.ts — 개념 코드
export function volumeCV(volumes: number[]): number {
  const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const variance = volumes.reduce((a, v) => a + (v - mean) ** 2, 0) / volumes.length;
  return Math.sqrt(variance) / mean;
}
// rank = universe.map(s => ({ ...s, score: volumeCV(last30(s)) }))
//               .sort((a, b) => b.score - a.score).slice(0, 10)
```

> 🔧 **산출식 보정 절차:** 개발 초기에 2026-10-06 KRX 실데이터로 위 산출식을 돌려 첨부 CSV 순위와 비교한다. 순위가 다르면 기간(20/30일)·유니버스 크기·가중치를 조정해 일치도를 높이고, 최종 산출식을 이 문서에 기록한다. **CSV 순위가 정답 데이터(Ground Truth) 역할**을 한다.

### 2.4 화면 구성 — 메인 최상단 히어로

```
┌─────────────────────────────────────────────────────────────┐
│ 🔥 이번 주 시장의 관심 TOP10        기준: 10/06(월) 종가 · KRX │
│ [최근 거래일 ▾] [주간]           관심도 = 거래량 변동성 ⓘ      │
├─────────────────────────────────────────────────────────────┤
│ ① SK하이닉스   ▲1   거래량 264만 (+26%)   주가 ±x.x%  [반도체]  │
│ ② 삼성전자     –    거래량 1,267만 (+10%) 주가 ±x.x%  [반도체]  │
│ ③ 삼성전기     NEW  거래량 73만 (+95%) 🔥 주가 +6.5%  [전자부품]│
│  … (모바일: 가로 스와이프 카드 / 데스크톱: 2열 × 5행 리스트)     │
├─────────────────────────────────────────────────────────────┤
│ 💡 이번 주 테마: 반도체·2차전지에 관심 집중 (AI 요약 2줄) [출처]│
└─────────────────────────────────────────────────────────────┘
  ↓ 그 아래: 주간 브리핑 리포트(3장 이후 섹션들)
```

| 요소 | 내용 |
|------|------|
| 순위 배지 | 1~3위 강조색(Navy/Blue/Sky), 지난주 대비 ▲▼–NEW |
| 거래량 표시 | 만 주 단위 축약 + 전일비 %, **+100% 이상은 🔥 급증 배지** |
| 주가 등락 | 상승 빨강 / 하락 파랑 (한국 시장 관례) |
| 테마 태그 | `data/sector-map.json` 정적 매핑 (반도체, 전자부품, 2차전지, 가전, 방산, 원전, 바이오) |
| 테마 인사이트 | TOP10의 테마 분포를 Claude가 2줄로 요약 + Perplexity 출처 번호 |
| ⓘ 툴팁 | "관심도는 거래량이 평소보다 얼마나 크게 출렁였는지를 뜻하며, 주가 상승을 의미하지 않습니다" |
| 관심 종목 추가 | 각 카드의 ☆ 버튼 → localStorage 관심 종목에 추가 |

### 2.5 종목 상세 — `/stock/[code]`

| 블록 | 데이터 출처 | 내용 |
|------|-------------|------|
| 요약 헤더 | KRX | 종가, 등락률, 거래량, 거래대금, 시가총액, 관심도 순위 |
| 30일 거래량·주가 차트 | KRX 일별 시세(30거래일) | 막대(거래량) + 선(종가), 30일 평균선 표시 |
| 왜 관심을 받았나 | Perplexity + Claude | 이번 주 이슈 3줄, 출처 링크 필수, **일회성 요인(리밸런싱 등) 구분 표기** |
| 최근 공시 | DART `list.json` | 최근 7일 공시 + GPT 중요도 분류 |
| 우선주 연결 | KRX | 보통주↔우선주 거래량 비교 (예: 삼성전자 ↔ 삼성전자우) |
| 관련 종목 | sector-map | 같은 테마의 TOP10 종목 바로가기 |

### 2.6 리포트 내 위치

주간 브리핑의 **첫 번째 섹션**을 "이번 주 관심도 TOP10"으로 고정한다(5.2 프롬프트 참고). 사용자의 관심 종목이 TOP10에 포함되면 해당 카드에 "내 관심 종목" 표시를 하고 리포트에서도 먼저 언급한다.

### 2.7 개발용 목업 데이터

KRX OPEN API는 서비스별 이용 승인을 기다려야 하므로, 첨부 CSV를 JSON 목업으로 변환해 **Phase 1부터 TOP10 화면을 먼저 완성**한다.

```json
// data/mock/top10-20261006.json
{
  "asOf": "2026-10-06",
  "metric": "volume_volatility",
  "source": "mock (D07_KRX_VOL_TOP10.csv)",
  "items": [
    { "rank": 1, "name": "SK하이닉스", "code": "000660", "volume": 2643758,
      "volumeChangePct": 26.4, "prevVolume": 2091000, "theme": "반도체",
      "note": "MSCI 리밸런싱 영향으로 변동폭 확대" }
    // … 10개 항목
  ]
}
```

- 환경변수 `TOP10_SOURCE=mock|krx` 로 전환
- CSV 정제 규칙: 숫자 쉼표 제거, `'+26.4%` 앞 작은따옴표 제거, 특징 문구 끝의 출처 표기(`stock.mk.co` 등)는 `sources[]`로 분리

---

## 3. 시스템 아키텍처

```
[브라우저]
  ├─ Firebase Auth (Google 팝업 로그인) → ID Token 발급
  ├─ localStorage: 관심 종목, 관심 자산, 최근 리포트 사본
  ├─ GET  /api/top10            ← 메인 최상단 히어로 (가장 먼저 로딩)
  └─ POST /api/briefing         (Authorization: Bearer <ID Token>)
            │
[Next.js Route Handler on Vercel]
  ① firebase-admin으로 ID Token 검증
  ② ⭐ TOP10 엔진
       KRX 30거래일 시세(일자별 캐시) → 유니버스 필터 → 관심도 지수 → 상위 10
  ③ 데이터 수집 (병렬, Promise.allSettled) ── Data Cache 재검증 주기로 캐시
       ├─ ECOS   : 기준금리·국고채·환율·CPI
       ├─ KRX    : KOSPI/KOSDAQ 지수, TOP10·관심 종목 시세
       ├─ DART   : TOP10 + 관심 종목 최근 7일 공시
       └─ 파인    : 정기예금·적금·연금저축 금리
  ④ LLM 파이프라인 (3단계)
       ├─ Perplexity : TOP10 종목 이슈 일괄 검색 + 주간 금융 뉴스 + 출처
       ├─ GPT        : 공시 목록 → 구조화 JSON(중요도·유형 분류)
       └─ Claude     : TOP10 테마 인사이트 + 주간 브리핑 Markdown 작성
  ⑤ 응답: { top10, report(markdown), data, sources[], asOf, errors[] }
```

### 3.1 설계 결정

| 결정 | 이유 |
|------|------|
| TOP10은 별도 API로 먼저 로딩 | 리포트 생성(LLM 수십 초)을 기다리지 않고 핵심 화면이 즉시 표시됨 |
| TOP10 숫자는 LLM 없이 코드로 확정 | 순위·거래량·등락률은 계산값 → 환각 여지 제거 |
| LLM 호출은 서버에서만 | API 키 노출 방지 |
| 로그인 필수 | 무제한 호출에 따른 LLM 비용 폭증 방지 |
| DB 대신 Data Cache | 시세·TOP10은 사용자와 무관 → 한 번 계산해 전원이 공유 |
| 과거 일자 시세는 영구 캐시 | 지나간 거래일 데이터는 바뀌지 않음 → 30일 계산 시 신규 1일만 호출 |
| `Promise.allSettled` | API 일부 실패에도 나머지로 결과 생성 |

---

## 4. 외부 금융 API 명세

> 모든 키는 `.env.local`에만 저장하고 서버 코드에서만 읽는다.

### 4.1 ⭐ KRX OPEN API — 시세 · TOP10 원천 데이터

- 발급: https://openapi.krx.co.kr — 인증키 발급 **후 서비스별로 "API 이용신청" → 담당자 승인** 필요 (인증키만으로는 호출 불가)
- Base URL: `https://data-dbg.krx.co.kr/svc/apis/`
- 인증: 요청 헤더 `AUTH_KEY: {KEY}`, 쿼리 `basDd=YYYYMMDD`
- 데이터는 **일별 종가 기준, 전 영업일까지** 제공 (실시간 아님)

| 용도 | 엔드포인트 | 이용신청 필요 |
|------|-----------|:--:|
| 유가증권 전종목 일별 시세 | `sto/stk_bydd_trd` | ✅ (TOP10 필수) |
| 코스닥 전종목 일별 시세 | `sto/ksq_bydd_trd` | ✅ (TOP10 필수) |
| 유가증권 종목 기본정보 | `sto/stk_isu_base_info` | ✅ (우선주 구분) |
| KOSPI / KOSDAQ 지수 | `idx/kospi_dd_trd`, `idx/kosdaq_dd_trd` | ✅ |
| ETF 시세 | `etp/etf_bydd_trd` | 선택 |

TOP10 계산에 쓰는 주요 응답 필드(전종목 시세): 종목코드·종목명, 종가, 전일 대비, 등락률, **누적 거래량**, 거래대금, 시가총액 — 실제 필드명은 KRX 개발 명세서에서 확인 후 `lib/sources/krx.ts`의 타입으로 고정한다.

| 캐시 정책 | 재검증 |
|-----------|--------|
| 과거 거래일 전종목 시세 | 영구(`revalidate: false`) |
| 최근 거래일 시세 | 12시간 |
| TOP10 계산 결과 | 12시간 (키: 기준일) |

> 30거래일 × 2개 시장 = 최초 60회 호출 → 이후 하루 2회만 추가 호출. **"바뀌지 않는 데이터는 한 번만 가져온다"**는 캐시 설계의 좋은 실습 예제다.

### 4.2 한국은행 ECOS — 거시·금리

- 발급: https://ecos.bok.or.kr/api/ (무료, 키당 일 약 1,000건 제한)
- 호출: `GET https://ecos.bok.or.kr/api/StatisticSearch/{KEY}/json/kr/1/100/{통계코드}/{주기}/{시작}/{종료}/{항목코드}`

| 지표 | 통계코드 | 주기 | 비고 |
|------|----------|------|------|
| 한국은행 기준금리 | 722Y001 | D | 항목코드 0101000 |
| 시장금리(국고채 3년 등) | 817Y002 | D | 항목코드는 ECOS 통계검색에서 확인 |
| 원/달러 환율 | 731Y001 | D | 매매기준율 |
| 소비자물가지수 | 901Y009 | M | 최근값만 표시 |

캐시 재검증: 6시간

### 4.3 DART 오픈API — 공시·재무

- 발급: https://opendart.fss.or.kr (일 20,000건)
- 사전 준비: `corpCode.xml`(zip)로 **종목코드 → corp_code 매핑 JSON**을 빌드 시 생성 (`scripts/build-corp-map.ts`)

| 용도 | 엔드포인트 | 주요 파라미터 |
|------|-----------|---------------|
| 공시 검색 | `GET https://opendart.fss.or.kr/api/list.json` | `crtfc_key, corp_code, bgn_de, end_de, page_count` |
| 주요 재무 계정 | `GET .../api/fnlttSinglAcnt.json` | `corp_code, bsns_year, reprt_code` |

공시 원문 링크: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo={rcept_no}` · 캐시 3시간
**TOP10 10개 종목은 항상 공시를 조회**하고, 관심 종목은 추가로 조회한다.

### 4.4 금감원 금융상품한눈에(파인) — 예적금·연금저축

- 발급: https://finlife.fss.or.kr → 오픈API 인증키 신청
- Base URL: `https://finlife.fss.or.kr/finlifeapi/`

| 상품 | 엔드포인트 |
|------|-----------|
| 정기예금 | `depositProductsSearch.json` |
| 적금 | `savingProductsSearch.json` |
| 연금저축 | `annuitySavingProductsSearch.json` |

- 공통 파라미터: `auth`, `topFinGrpNo`(020000 은행 / 030300 저축은행 / 050000 보험 / 060000 금융투자), `pageNo`
- 응답: `baseList` + `optionList` → `fin_prdt_cd`로 조인 · 월 1회 갱신 → 캐시 24시간

---

## 5. Claude Financial Services 활용 전략

### 5.1 저장소의 정체

`anthropics/financial-services`는 웹앱용 SDK가 아니라 **에이전트·스킬(SKILL.md)·슬래시 커맨드·MCP 커넥터 묶음**이다(Apache-2.0). Cowork 플러그인 또는 Managed Agents API로 배포하도록 설계되어 있고, 기본 MCP 커넥터(FactSet, Morningstar, S&P Global 등)는 기관용 유료 구독이 필요하다. 저장소 자체가 "투자 권유가 아니며 모든 산출물은 사람의 검토를 전제한다"고 명시한다.

### 5.2 "스킬 이식" 매핑

| 원본 스킬 | 이 앱에서의 변형 | 사용 위치 |
|-----------|------------------|-----------|
| `idea-generation` / `screen` | 스크리닝 결과 제시 방식 → **TOP10 카드·순위 변동 서술 규칙** | TOP10 테마 인사이트 프롬프트 |
| `sector-overview` | TOP10의 **테마 분포 요약**(반도체·2차전지 등) | TOP10 인사이트 + 리포트 섹션 1 |
| `morning-note` | 데일리 노트 → 주간 브리핑 톤·구조 (3줄 요약 → 상세) | 리포트 시스템 프롬프트 |
| `catalyst-calendar` | **다음 주 일정** (금통위, TOP10 종목 실적발표·배당기준일) | 리포트 마지막 섹션 |
| `earnings-analysis` | TOP10 종목에 실적 공시가 있을 때 "숫자 요약 + 의미" 3줄 | GPT 추출 → Claude 서술 |

이식 절차: ① `SKILL.md`에서 작성 규칙·섹션 구조·금지 사항만 추출 → ② 개인 투자자용 쉬운 한국어로 변환 → ③ `lib/prompts/`에 저장(Apache-2.0 출처 표기)

### 5.3 데이터 커넥터 대체표

| 원본 MCP 커넥터 | 한국 대체 데이터 |
|-----------------|------------------|
| FactSet / S&P Global (재무·스크리닝) | KRX 전종목 시세 + DART `fnlttSinglAcnt` |
| MT Newswires / Aiera (뉴스·콜) | Perplexity Sonar 검색 |
| LSEG (금리·매크로) | 한국은행 ECOS |
| Morningstar (상품) | 금감원 파인 API |

> 💡 v2 아이디어: KRX TOP10 엔진 + DART를 **자체 MCP 서버**로 묶으면 같은 기능을 Claude Desktop/Cowork에서도 "이번 주 관심도 TOP10 알려줘"로 호출할 수 있다.

---

## 6. LLM 파이프라인 명세

### 6.1 역할 분담

| 단계 | 모델 | 입력 | 출력 | 실패 시 폴백 |
|------|------|------|------|--------------|
| ① TOP10 이슈 검색 | Perplexity `sonar-pro` | TOP10 종목명 10개, 기준 주간 | 종목별 이슈 1~2줄 + citations (**1회 일괄 호출**) | "이슈 수집 실패", 숫자 카드만 표시 |
| ② 주간 뉴스 | Perplexity `sonar-pro` | 기준일, 관심 자산 | 뉴스 요약 5~8개 + citations | 섹션 생략 |
| ③ 공시 구조화 | GPT (env `OPENAI_MODEL`) | DART 공시 목록 | JSON (6.4 스키마) | Claude가 대신 수행 |
| ④ 테마 인사이트 + 리포트 | Claude (env `ANTHROPIC_MODEL`, 예: `claude-sonnet-5-5`) | TOP10 JSON + ①②③ + 원자료 | 테마 2줄 + 주간 브리핑 Markdown | GPT가 대신 작성 |

- 필수 프로바이더: Claude 또는 GPT 중 최소 1개. Perplexity는 선택.
- 모델명은 모두 환경변수로 두어 교체 가능하게 한다.

### 6.2 TOP10 이슈 검색 프롬프트 (Perplexity)

```text
다음 한국 상장 종목 10개 각각에 대해, {주간 시작일}~{기준일} 사이 거래량이
평소보다 크게 움직인 이유가 될 만한 공개 뉴스·이벤트를 1~2문장으로 정리하라.
- 지수 리밸런싱, 공매도, 배당락 같은 일회성 수급 요인은 [일회성]으로 표시
- 근거가 없으면 "확인된 이슈 없음"이라고 쓰고 추측하지 말 것
- 종목별로 출처 번호를 붙일 것
종목: {rank. name(code)} × 10
출력: JSON { "items": [{ "code", "issue", "oneOff": boolean, "citations": [] }] }
```

### 6.3 Claude 시스템 프롬프트 골격

```text
당신은 한국 개인 재테크 이용자를 위한 주간 금융 브리핑 작성자다.

[규칙]
1. 제공된 JSON의 숫자만 사용한다. 숫자를 새로 계산하거나 추측하지 않는다.
2. 특정 종목·상품의 매수/매도/가입을 권유하지 않는다.
3. "관심도(거래량 변동성)가 높다"는 것이 주가 상승을 뜻하지 않음을 첫 섹션에서 한 번 밝힌다.
4. 모든 수치 옆에 기준일을 표기하고, 뉴스·이슈에는 출처 번호[n]를 붙인다.
5. 일회성 수급 요인([일회성])과 기업 고유 이슈를 구분해 서술한다.
6. 전문 용어는 처음 등장할 때 괄호로 쉬운 설명을 덧붙인다.

[출력 구조]
## 🔥 이번 주 관심도 TOP10   ← 표(순위·변동·거래량 전일비·주가 등락) + 테마 요약 + 종목별 한 줄
## 이번 주 3줄 요약
## 금리·환율 (기준금리, 국고채 3년, 원/달러)
## 주식시장과 내 관심 종목
## 예·적금 금리 TOP 5
## 보험·연금 소식
## 다음 주 체크할 일정 (TOP10 종목 실적·배당 일정 우선)
```

### 6.4 GPT 공시 구조화 스키마 (Structured Outputs)

```json
{
  "type": "object",
  "properties": {
    "disclosures": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "corp_name": { "type": "string" },
          "stock_code": { "type": "string" },
          "rcept_no": { "type": "string" },
          "in_top10": { "type": "boolean" },
          "type": { "enum": ["실적", "배당", "증자·감자", "지분변동", "주요계약", "기타"] },
          "importance": { "enum": ["high", "medium", "low"] },
          "one_line": { "type": "string" }
        },
        "required": ["corp_name", "stock_code", "rcept_no", "in_top10", "type", "importance", "one_line"]
      }
    }
  },
  "required": ["disclosures"]
}
```

### 6.5 비용 통제 (DB 없음 구성의 핵심)

| 장치 | 방법 |
|------|------|
| TOP10 공용 캐시 | TOP10·이슈 해설은 **모든 사용자에게 동일** → 기준일당 1회만 생성 |
| 원자료 캐시 | `unstable_cache` / `fetch(..., { next: { revalidate } })` |
| 리포트 캐시 | 키 = `주차 + 관심종목 해시` → 같은 조합은 재생성 안 함 (7일) |
| 클라이언트 사본 | 마지막 리포트를 localStorage에 저장 |
| 호출 제한 | uid당 "다시 생성" 하루 3회 (MVP는 메모리 기반 근사치) |
| 토큰 절감 | 전종목 시세는 TOP10+관심 종목만 필터 후 LLM에 전달 |

---

## 7. 인증 — Firebase Google 로그인

### 7.1 흐름

1. 클라이언트: `signInWithPopup(auth, new GoogleAuthProvider())`
2. 클라이언트: `await user.getIdToken()` → `Authorization: Bearer` 헤더
3. 서버: `firebase-admin`의 `verifyIdToken()` → `uid` 확보
4. 미인증 요청은 `401`

> 선택: 로그인 전 랜딩 화면에서 **TOP10 순위(숫자만, AI 해설 제외)**를 미리보기로 공개하면 가입 전환에 도움이 된다. TOP10은 공용 캐시이므로 추가 비용이 거의 없다.

### 7.2 구성 요소 (여행 저널 웹앱 3-tier 구조 재사용)

| 파일 | 역할 |
|------|------|
| `lib/firebase/client.ts` | Firebase 클라이언트 초기화 (`NEXT_PUBLIC_*`) |
| `lib/firebase/admin.ts` | firebase-admin 초기화 (서버 전용) |
| `components/AuthProvider.tsx` | `onAuthStateChanged` 기반 Context |
| `components/ProtectedRoute.tsx` | 비로그인 시 `/login` 이동 |
| `app/login/page.tsx` | Google 로그인 버튼, 팝업 차단 안내, TOP10 미리보기 |

### 7.3 트러블슈팅 표

| 오류 | 원인 / 해결 |
|------|-------------|
| `auth/operation-not-allowed` | Firebase Console → Authentication → Google 제공업체 활성화 |
| `auth/unauthorized-domain` | 승인된 도메인에 Vercel 도메인 추가 |
| `auth/popup-blocked` | 팝업 차단 감지 후 안내, 모바일은 `signInWithRedirect` 대안 |
| 서버 `verifyIdToken` 실패 | `FIREBASE_PRIVATE_KEY`의 `\n` 이스케이프 처리 |

---

## 8. 화면 설계

| 경로 | 화면 | 주요 요소 |
|------|------|-----------|
| `/login` | 로그인 | 서비스 소개, **TOP10 순위 미리보기**, Google 로그인, 면책 고지 |
| `/onboarding` | 관심 설정 | 관심 자산 체크, **TOP10에서 바로 관심 종목 담기**, 종목 검색(최대 10개) |
| `/` | 메인 | ⭐ **최상단 TOP10 히어로(2.4)** → 3줄 요약 → 리포트 섹션 → "다시 생성" |
| `/stock/[code]` | 종목 상세 | 30일 거래량·주가 차트, 관심 이유, 공시, 우선주 연결(2.5) |
| `/rates` | 예적금 비교 | 기간·권역 필터, 금리순 표 |
| `/settings` | 설정 | 관심 종목 수정, 로그아웃, 저장 데이터 삭제 |

### 8.1 메인 화면 정보 우선순위

| 순서 | 영역 | 첫 화면 노출 |
|:--:|------|:--:|
| 1 | 🔥 관심도 TOP10 히어로 + 테마 인사이트 | ✅ |
| 2 | 이번 주 3줄 요약 | ✅ |
| 3 | 금리·환율 카드 | 스크롤 |
| 4 | 내 관심 종목 | 스크롤 |
| 5 | 예적금 TOP5 · 보험·연금 · 다음 주 일정 | 스크롤 |

### 8.2 디자인 토큰

| 토큰 | 값 |
|------|----|
| Navy (헤더, 1위 배지) | `#1E3A5F` |
| Blue (주요 강조, 2위 배지) | `#1A56A4` |
| Sky (액센트, 3위 배지) | `#0EA5E9` |
| 상승 / 하락 | `#D92D20` / `#1A56A4` (상승=빨강, 하락=파랑) |
| 거래량 급증 배지 | `#F59E0B` (🔥, 전일비 +100% 이상) |
| 폰트 | Pretendard, 대체 Malgun Gothic · 숫자는 `tabular-nums` |

---

## 9. API 엔드포인트 (Next.js Route Handlers)

| 메서드 · 경로 | 설명 | 인증 |
|---------------|------|------|
| ⭐ `GET /api/top10?date=&view=day\|week` | 관심도 TOP10 (순위·지표·순위 변동·테마) | 미리보기는 공개, 해설 포함 시 필수 |
| ⭐ `GET /api/top10/[code]` | 종목 상세: 30일 시세, 이슈 해설, 공시 | 필수 |
| `POST /api/briefing` | 주간 브리핑 생성 (body: `{ tickers[], assets[] }`) | 필수 |
| `GET /api/market` | ECOS+KRX 지수 원자료 | 필수 |
| `GET /api/disclosures?tickers=` | DART 최근 7일 공시 | 필수 |
| `GET /api/products?type=deposit&term=12` | 파인 금리 비교 | 필수 |
| `GET /api/stocks/search?q=` | 종목명 검색 | 필수 |

`/api/top10` 응답 예시:

```json
{
  "asOf": "2026-10-06",
  "metric": { "name": "volume_volatility", "window": 30, "universe": 100 },
  "items": [
    { "rank": 1, "rankChange": 1, "code": "000660", "name": "SK하이닉스",
      "theme": "반도체", "volume": 2643758, "volumeChangePct": 26.4,
      "priceChangePct": null, "score": 0.0, "isPreferred": false,
      "issue": { "text": "…", "oneOff": true, "citations": [1] } }
  ],
  "themeInsight": "…",
  "sources": [], "errors": []
}
```

공통 응답 필드: `asOf`, `sources[]`, `errors[]`(부분 실패 목록)

---

## 10. 폴더 구조

```
moneyweekly/
├─ app/
│  ├─ (auth)/login/page.tsx
│  ├─ onboarding/page.tsx
│  ├─ stock/[code]/page.tsx            # ⭐ TOP10 종목 상세
│  ├─ rates/page.tsx
│  ├─ settings/page.tsx
│  ├─ page.tsx                         # TOP10 히어로 + 주간 브리핑
│  └─ api/
│     ├─ top10/route.ts                # ⭐
│     ├─ top10/[code]/route.ts         # ⭐
│     ├─ briefing/route.ts
│     ├─ market/route.ts
│     ├─ disclosures/route.ts
│     ├─ products/route.ts
│     └─ stocks/search/route.ts
├─ lib/
│  ├─ firebase/{client,admin}.ts
│  ├─ sources/{krx,ecos,dart,finlife}.ts
│  ├─ top10/{engine,universe,mock}.ts  # ⭐ 관심도 순위 엔진
│  ├─ calc/{attention,returns,dates}.ts
│  ├─ llm/{perplexity,openai,anthropic}.ts
│  ├─ prompts/{top10-issues,weekly-briefing}.ts
│  └─ auth/verify.ts
├─ components/
│  ├─ top10/{Top10Hero,Top10Card,RankBadge,ThemeInsight,VolumeChart}.tsx  # ⭐
│  └─ (AuthProvider, ProtectedRoute, ReportView, RateTable, …)
├─ data/
│  ├─ mock/top10-20261006.json         # ⭐ 첨부 CSV 변환본
│  ├─ sector-map.json                  # ⭐ 종목코드 → 테마
│  └─ corp-map.json
├─ scripts/{build-corp-map,csv-to-mock}.ts
└─ .env.local.example
```

### 10.1 환경변수

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
# ⭐ TOP10
TOP10_SOURCE=mock            # mock | krx
TOP10_WINDOW_DAYS=30
TOP10_UNIVERSE_SIZE=100
# 금융 API
KRX_AUTH_KEY=
ECOS_API_KEY=
DART_API_KEY=
FINLIFE_API_KEY=
# LLM
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-5-5
OPENAI_API_KEY=
OPENAI_MODEL=
PERPLEXITY_API_KEY=
PERPLEXITY_MODEL=sonar-pro
```

---

## 11. 법적·윤리 고려 사항

| 항목 | 대응 |
|------|------|
| ⭐ TOP10의 추천 오인 | 화면 제목을 "추천"이 아닌 **"관심"**으로 고정, ⓘ 툴팁과 리포트에서 "관심도 ≠ 상승 신호" 명시 |
| 투자 권유 해석 위험 | 매수/매도/가입 권유 문구 금지(프롬프트 규칙 2), 전 페이지 면책 고지 |
| 유사투자자문업 | 불특정 다수에게 **유료로** 개별 투자 판단을 제공하면 신고 대상이 될 수 있음 → MVP는 무료·정보 제공형, 유료화 전 법률 검토 |
| 데이터 이용약관 | KRX·DART·ECOS·파인 약관의 재배포·상업적 이용 조건 확인, 출처 표기 |
| 개인정보 | 서버에 사용자 데이터 미저장, 개인정보처리방침 페이지 제공 |
| AI 생성 고지 | 리포트·이슈 해설에 "AI가 공개 데이터를 바탕으로 작성한 요약" 배지 |

면책 고지 문안 예시:
> 본 서비스는 공공 데이터와 AI를 활용한 정보 제공 목적이며 투자 권유가 아닙니다. "관심도 TOP10"은 거래량 변동성 기준 순위로 주가 전망과 무관합니다. 수치는 기준일 데이터로 실제와 다를 수 있으며, 투자 판단의 책임은 이용자 본인에게 있습니다.

---

## 12. 구현 로드맵

| 단계 | 기간 | 목표 | 완료 기준 |
|------|------|------|-----------|
| Phase 1 | 1주 | Next.js 셋업 + Firebase 로그인 + ⭐ **목업 기반 TOP10 히어로** | 로그인 후 메인 최상단에 CSV 기준 TOP10 카드 표시 |
| Phase 2 | 1주 | ⭐ **KRX 연동 + 관심도 엔진** + 종목 상세 | `TOP10_SOURCE=krx`로 전환, 10/06 기준 순위를 CSV와 비교·보정 |
| Phase 3 | 1주 | ECOS·파인·DART 연동 + 관심 종목 온보딩 | 금리 카드·예적금 표·TOP10 공시 표시 |
| Phase 4 | 1주 | LLM 파이프라인 (TOP10 이슈 → 테마 인사이트 → 리포트) | 7개 섹션 브리핑 생성, 출처 표시 |
| Phase 5 | 0.5주 | 캐시·호출 제한·면책 고지·Vercel 배포 | 공개 URL 베타 테스트 |

> ⏱ KRX 이용신청은 **Phase 1 첫날** 제출한다. 승인 대기 중에는 목업으로 TOP10 화면을 완성해 두는 것이 이번 일정의 핵심이다.

---

## 13. 테스트 체크리스트

**⭐ TOP10**
- [ ] 목업 모드에서 CSV와 동일한 순서·수치로 10개 카드가 표시되는가
- [ ] KRX 모드에서 2026-10-06 기준 순위가 CSV 순위와 몇 개 일치하는지 리포트로 출력되는가(보정 근거)
- [ ] 거래량 전일비 +100% 이상 종목에 🔥 배지가 붙는가 (예: 삼성SDI, LG전자, LG에너지솔루션)
- [ ] 우선주(삼성전자우)가 보통주와 연결 표시되는가
- [ ] 지난주 대비 순위 변동(▲▼, NEW)이 올바른가
- [ ] Perplexity 실패 시에도 숫자 카드는 정상 표시되는가
- [ ] 이슈 해설에 출처가 없는 문장이 없는가, [일회성] 표시가 작동하는가

**공통**
- [ ] 각 금융 API 실패 시 `errors[]` 기록 후 나머지로 리포트 생성되는가
- [ ] 주말·공휴일 기준일이 직전 영업일로 보정되는가
- [ ] 리포트의 모든 숫자가 원자료 JSON과 일치하는가
- [ ] "매수", "추천", "가입하세요" 등 금칙어가 없는가
- [ ] 비로그인 상태의 보호 API 호출 시 401이 반환되는가
- [ ] 모바일(375px)에서 TOP10 카드 스와이프가 자연스러운가

---

## 14. 🎓 교육 활용 포인트

| 커리큘럼 | 연결 지점 |
|----------|-----------|
| Day 2 (데이터 분석) | 첨부 CSV를 읽고 "순위 기준이 거래량 크기가 아니라 변동성"임을 발견하는 탐험 미션 |
| Day 3 · 12 (멀티 LLM) | Perplexity(검색)·GPT(구조화)·Claude(작성)의 역할 분담 체감 |
| Day 6 (Skills) | financial-services 스킬을 한국 개인 투자자용으로 "이식" |
| Day 9 (Google 연동) | 여행 저널 웹앱 Firebase 로그인 구조를 Next.js로 응용 |
| Day 14 (JSON 추출) | CSV → 목업 JSON 변환, DART 공시 → Structured Outputs |
| Day 15 (Function Calling) | v2 "이번 주 TOP10 중 2차전지 종목만 보여줘" 질문형 챗봇 |
| Day 17 (멀티 에이전트) | 수집 → 순위 계산 → 이슈 검색 → 작성 파이프라인을 LangGraph로 재구현 |

**입문자 레벨업 포인트 4가지**
1. **목업 우선 개발**: 외부 API 승인을 기다리지 않고 CSV로 화면부터 완성한다
2. **"숫자는 코드, 문장은 AI"**: TOP10 순위는 코드가 계산하고, AI는 이유만 설명한다
3. **정답 데이터로 검증**: 내가 만든 순위 엔진을 CSV 순위와 비교해 보정한다
4. **부분 실패 설계**: 외부 API 4개 + LLM 3개 중 일부가 실패해도 핵심 화면은 살아 있게 만든다

---

## 15. 참고 링크

- Claude for Financial Services: https://github.com/anthropics/financial-services
- KRX OPEN API: https://openapi.krx.co.kr
- DART 오픈API: https://opendart.fss.or.kr
- 한국은행 ECOS 오픈API: https://ecos.bok.or.kr/api/
- 금융상품 한눈에 오픈API: https://finlife.fss.or.kr
- Firebase Authentication: https://firebase.google.com/docs/auth/web/google-signin
- 참고 저장소(여행 저널 Google 로그인): https://github.com/junsang-dong/goorm-260702-travel-canvas-google-login

---
*작성: 동준상 · 넥스트플랫폼 · nextplatform.net*
