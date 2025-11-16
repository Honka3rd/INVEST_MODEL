import { ajax } from "rxjs/ajax";
import z from "zod";
import { Params } from "./params";
import { map } from "rxjs";
import { injectable } from "inversify";
import type { ModelAPIResponse } from "./types";

export type DynamicPeriod = "y" | "mo" | "d";
export type FixedPeriod = "ytd" | "max";

export type DynamicInterval = "m" | "h" | "d" | "wk" | "mo";

export type Period = `${number}${DynamicPeriod}` | FixedPeriod;
export type Interval = `${number}${DynamicInterval}`;

export type PortfolioMetricsParams = {
  symbols: string[]; // 股票代碼陣列
  period: Period; // e.g. '1y'
  interval: Interval; // e.g. '1d'
  totalAssets: number;
};

@injectable()
export class MetricsAPI {
  private static readonly PERIOD_REGEX = /^(?:\d+(y|mo|d)|ytd|max)$/;
  private static readonly INTERVAL_REGEX = /^\d+(m|h|d|wk|mo)$/;

  isValidPeriod(period: string): period is Period {
    return MetricsAPI.PERIOD_REGEX.test(period);
  }

  isValidInterval(interval: string): interval is Interval {
    return MetricsAPI.INTERVAL_REGEX.test(interval);
  }

  isValidSymbols(symbols: string[]): symbols is string[] {
    return (
      Array.isArray(symbols) &&
      symbols.length > 0 &&
      symbols.every((s) => typeof s === "string" && s.trim().length > 0)
    );
  }
  static readonly validator = z.object({
    weights: z.record(z.string(), z.number()),
    amounts: z.record(z.string(), z.number()),
    portfolioReturn: z.number().nullish(),
    portfolioRisk: z.number().nullish(),
    sharpe: z.number(),
  });

  metrics(params: PortfolioMetricsParams) {
    return ajax.post<ModelAPIResponse<Metrics>>(Params.METRICS, params).pipe(
      map(({ response, status }) => {
        if (status !== 200) {
          throw new Error(`API 錯誤，狀態碼 ${status}`);
        }
        return MetricsAPI.validator.parse(response.data);
      })
    );
  }
}

export type Metrics = z.infer<typeof MetricsAPI.validator>;
