export type RankChange = number | "new" | null;

export type PricePoint = {
  date: string;
  close: number;
  volume: number;
  changePct: number;
};

export type Top10Item = {
  rank: number;
  rankChange: RankChange;
  name: string;
  code: string;
  volume: number;
  volumeChangePct: number;
  prevVolume: number;
  theme: string;
  note: string;
  priceChangePct: number | null;
  closePrice: number | null;
  score: number | null;
  isPreferred: boolean;
  preferredCode: string | null;
  commonCode: string | null;
  points?: PricePoint[];
};

export type Top10Response = {
  asOf: string;
  metric: { name: string; window: number; universe: number };
  source: string;
  themeInsight: string;
  rankChangeNote: string;
  items: Top10Item[];
  sources: string[];
  errors: { source: string; message: string }[];
  disclosures: Disclosure[];
  indices: { name: string; close: number; changePct: number }[];
  view?: "day" | "week";
};

export type IssueNote = {
  code: string;
  text: string;
  oneOff: boolean;
  citations: number[];
};

export type NewsItem = {
  summary: string;
  citations: number[];
};

export type StructuredDisclosure = {
  corpName: string;
  stockCode: string;
  rceptNo: string;
  inTop10: boolean;
  type: "실적" | "배당" | "증자·감자" | "지분변동" | "주요계약" | "기타";
  importance: "high" | "medium" | "low";
  oneLine: string;
};

export type Briefing = {
  asOf: string;
  themeInsight: string;
  summary: string[];
  issues: IssueNote[];
  news: NewsItem[];
  structuredDisclosures: StructuredDisclosure[];
  markdown: string;
  citationUrls: string[];
  sources: string[];
  errors: { source: string; message: string }[];
  cached: boolean;
};

export type Disclosure = {
  corpName: string;
  stockCode: string;
  reportName: string;
  rceptNo: string;
  rceptDt: string;
};

export type AssetId = "savings" | "stock" | "insurance";

export type WatchItem = {
  code: string;
  name: string;
};

export type StockPeer = {
  code: string;
  name: string;
  close: number;
  volume: number;
  relation: "preferred" | "common";
};

export type StockDetail = {
  code: string;
  name: string;
  market: string;
  asOf: string;
  close: number | null;
  changePct: number | null;
  volume: number | null;
  marketCap: number | null;
  rank: number | null;
  score: number | null;
  theme: string;
  note: string;
  points: PricePoint[];
  volumeAverage: number | null;
  disclosures: Disclosure[];
  peer: StockPeer | null;
  issue: IssueNote | null;
  related: { code: string; name: string; rank: number; theme: string }[];
  sources: string[];
  errors: { source: string; message: string }[];
};

export type MarketIndicator = {
  id: string;
  name: string;
  value: number;
  unit: string;
  date: string;
};

export type MarketResponse = {
  indicators: MarketIndicator[];
  sources: string[];
  errors: { source: string; message: string }[];
};

export type DepositProduct = {
  id: string;
  company: string;
  name: string;
  termMonths: number;
  baseRate: number;
  maxRate: number;
  rateType: string;
  group: string;
  kind: "deposit" | "saving";
};

export type ProductsResponse = {
  products: DepositProduct[];
  sources: string[];
  errors: { source: string; message: string }[];
};
