export type RankChange = number | "new" | null;

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
