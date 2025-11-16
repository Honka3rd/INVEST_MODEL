export type DynamicPeriod = "y" | "mo" | "d";
export type FixedPeriod = "ytd" | "max";

export type DynamicInterval = "m" | "h" | "d" | "wk" | "mo";

export type Period = `${number}${DynamicPeriod}` | FixedPeriod;
export type Interval = `${number}${DynamicInterval}`;
export interface FixedAsset {
  name: string; // 資產名稱
  amount: number; // 固定金額 (RMB)
}

export type RfMeta = {
  rf: number;
  value: `${string}%`; // 帶百分號的字串
  date: string; // ISO 日期字符串
};

export interface OptimizationResult {
  weights: number[]; // 百分比陣列
  amounts: number[]; // 金額陣列 (RMB)
  sharpe: number;
  assetAllocations: string[]; // 如 "Gold ETF: 15% (75,000 RMB)"
  totalAssets: number; // 總資產
}

export interface ChartResponse {
  chart: {
    result: ChartResult[] | null;
    error: {
      code: string;
      description: string;
    } | null;
  };
}

export interface ChartResult {
  meta: ChartMeta;
  timestamp?: number[]; // UNIX seconds since epoch
  indicators: {
    quote?: QuoteIndicator[];
    adjclose?: AdjCloseIndicator[];
    // sometimes there are other indicators, e.g. "adjclose"
    [key: string]: any;
  };
  // there might be “events” like dividends / splits
  events?: ChartEvents;
  // optionally: “comparisons”, etc
  [key: string]: any;
}

export interface ChartMeta {
  currency: string;
  symbol: string;
  exchangeName: string;
  instrumentType: string;
  firstTradeDate?: number; // UNIX seconds
  regularMarketTime?: number; // UNIX seconds
  gmtoffset?: number;
  timezone?: string;
  exchangeTimezoneName?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  // there are many possible fields; include as needed
  [key: string]: any;
}

export interface QuoteIndicator {
  open?: (number | null)[];
  high?: (number | null)[];
  low?: (number | null)[];
  close?: (number | null)[];
  volume?: (number | null)[];
  [key: string]: (number | null)[] | undefined;
}

export interface AdjCloseIndicator {
  adjclose: (number | null)[];
}

export interface ChartEvents {
  splits?: { [dateUnix: string]: { date: number; ratio: number } };
  dividends?: { [dateUnix: string]: { date: number; amount: number } };
  // optionally more event types
}

export type PortfolioMetricsParams = {
  symbols: string[]; // 股票代碼陣列
  period: Period; // e.g. '1y'
  interval: Interval; // e.g. '1d'
  totalAssets: number;
};

export type PublicOpinions = {
  neutral: string;
  popular: string;
  professional: string;
};

export type Series = {
  symbol: string;
  dates: string[];
  prices: number[];
  returns: number[];
};

export type SharpeResult = {
  windowDays: number;
  nObs: number;
  sharpeDaily: number;
  sharpeAnnual: number;
  meanExcessDaily: number;
  stdDaily: number;
  rfAnnual: number;
  rfDaily: number;
  start: string;
  end: string;
  weights: Record<string, number>;
};

export type AllocationInput = Record<string, number>; // 例如 { QQQ: 10000, SPY: 6000, LTL: 12000 }
