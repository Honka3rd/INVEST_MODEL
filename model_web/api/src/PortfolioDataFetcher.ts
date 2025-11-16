import dayjs from "dayjs";
import { injectable } from "inversify";
import {
  catchError,
  concat,
  from,
  map,
  of,
  reduce,
  switchMap,
  tap,
} from "rxjs";
import z from "zod";
import { DebugLogger, Logger } from "./logger";
import { DynamicPeriod, Interval, Period } from "./types";

@injectable()
export class PortfolioDataFetcher {
  private static readonly LOGGER: Logger =
    DebugLogger.getLogger(PortfolioDataFetcher);
  private static readonly PERIOD_REGEX = /^(?:\d+(y|mo|d)|ytd|max)$/;
  private static readonly INTERVAL_REGEX = /^\d+(m|h|d|wk|mo)$/;
  private static readonly YEARLY_SECONDS = 31536000; // 1 年的秒數
  private static readonly USER_AGENT =
    "Mozilla/5.0 (compatible; MPT-Resolver/1.0)";

  isValidPeriod(period: string): period is Period {
    return PortfolioDataFetcher.PERIOD_REGEX.test(period);
  }

  isValidInterval(interval: string): interval is Interval {
    return PortfolioDataFetcher.INTERVAL_REGEX.test(interval);
  }

  isValidSymbols(symbols: string[]): symbols is string[] {
    return (
      Array.isArray(symbols) &&
      symbols.length > 0 &&
      symbols.every((s) => typeof s === "string" && s.trim().length > 0)
    );
  }

  private static readonly QuoteIndicatorSchema = z
    .object({
      open: z.array(z.number().nullable()).optional(),
      high: z.array(z.number().nullable()).optional(),
      low: z.array(z.number().nullable()).optional(),
      close: z.array(z.number().nullable()).optional(),
      volume: z.array(z.number().nullable()).optional(),
    })
    .strict(); // 加 .strict() 防未知字段

  private static readonly AdjCloseIndicatorSchema = z
    .object({
      adjclose: z.array(z.number().nullable()),
    })
    .optional(); // 改為 optional，避免無 adjclose 時拋錯

  private static readonly ChartMetaSchema = z
    .object({
      currency: z.string(), // required，API 總有
      symbol: z.string(), // required
      exchangeName: z.string(), // required
      instrumentType: z.string().optional(),
      firstTradeDate: z.number().optional(),
      regularMarketTime: z.number().optional(),
      gmtoffset: z.number().optional(),
      timezone: z.string().optional(),
      exchangeTimezoneName: z.string().optional(),
      regularMarketPrice: z.number().optional(),
      chartPreviousClose: z.number().optional(),
      previousClose: z.number().optional(),
      // 可选：加常见额外键作为 optional()，增强但不强制
      fullExchangeName: z.string().optional(),
      hasPrePostMarketData: z.boolean().optional(),
      fiftyTwoWeekHigh: z.number().optional(),
      fiftyTwoWeekLow: z.number().optional(),
      regularMarketDayHigh: z.number().optional(),
      regularMarketDayLow: z.number().optional(),
      regularMarketVolume: z.number().optional(),
      longName: z.string().optional(),
      shortName: z.string().optional(),
      priceHint: z.number().optional(),
      currentTradingPeriod: z.object({}).optional(), // 宽松对象
      dataGranularity: z.string().optional(),
      range: z.string().optional(),
      validRanges: z.array(z.string()).optional(),
    })
    .loose(); // 改為 .loose() 允許未知字段;

  private static readonly ChartEventsSchema = z
    .object({
      splits: z
        .record(
          z.string(),
          z.object({
            date: z.number(),
            ratio: z.number(),
          })
        )
        .optional(),
      dividends: z
        .record(
          z.string(),
          z.object({
            date: z.number(),
            amount: z.number(),
          })
        )
        .optional(),
    })
    .optional();

  private static readonly ChartResultSchema = z
    .object({
      meta: PortfolioDataFetcher.ChartMetaSchema,
      timestamp: z.array(z.number()).optional(),
      indicators: z.looseObject({
        quote: z
          .array(PortfolioDataFetcher.QuoteIndicatorSchema)
          .min(1)
          .optional(), // 加 .min(1) 確保至少 1 個 quote
        adjclose: z
          .array(PortfolioDataFetcher.AdjCloseIndicatorSchema)
          .optional(),
      }),
      events: PortfolioDataFetcher.ChartEventsSchema.optional(),
    })
    .strict();

  private static readonly ChartResponseSchema = z
    .object({
      chart: z.looseObject({
        result: z
          .array(PortfolioDataFetcher.ChartResultSchema)
          .nonempty()
          .nullable(), // 加 .nonempty() 驗證非空
        error: z
          .object({
            code: z.string(),
            description: z.string(),
          })
          .nullable(),
      }),
    })
    .strict(); // 整體 strict

  private generateYahooChartUrl(
    symbol: string,
    period: Period = "1y",
    interval: Interval = "1d"
  ): string {
    const now = dayjs().unix(); // 現在 Unix 戳 (e.g., 1759622400 for 2025-10-05)
    let start: number = now - PortfolioDataFetcher.YEARLY_SECONDS;

    if (period === "ytd") {
      start = dayjs().startOf("year").unix(); // 今年年初 (e.g., 1704067200 for 2024-01-01)
    } else if (period === "max") {
      start = 0; // 從最早開始
    } else {
      // 處理動態期間，如 '1y', '6mo', '30d'
      const match = period.match(/^(\d+)(y|mo|d)$/);
      if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2] as DynamicPeriod;
        switch (unit) {
          case "y":
            start = dayjs().subtract(value, "year").unix();
            break;
          case "mo":
            start = dayjs().subtract(value, "month").unix();
            break;
          case "d":
            start = dayjs().subtract(value, "day").unix();
            break;
        }
      }
    }

    const baseUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    return `${baseUrl}?period1=${start}&period2=${now}&interval=${interval}`;
  }

  private static extractClosed(
    data: z.infer<typeof PortfolioDataFetcher.ChartResponseSchema>
  ) {
    return data.chart.result &&
      data.chart.result[0]?.indicators?.quote &&
      data.chart.result[0].indicators.quote[0]?.close
      ? data.chart.result[0].indicators.quote[0].close.filter(
          (p: number | null) => p !== null
        )
      : [];
  }

  public resolve(
    symbols: string[], // e.g., ['GLD', 'TLT', 'QQQ']
    period: Period = "1y",
    interval: Interval = "1d",
    signal?: AbortSignal
  ) {
    return concat(
      ...symbols.map((symbol) => {
        return this.getYahooChartJson(
          this.generateYahooChartUrl(symbol, period, interval),
          signal
        ).pipe(
          map((data) => ({
            closes: PortfolioDataFetcher.extractClosed(data),
            symbol,
          }))
        );
      })
    ).pipe(
      reduce((prices, { closes, symbol }) => {
        prices[symbol] = closes;
        return prices;
      }, {} as Record<string, number[]>),
      catchError((err: Error) =>
        of<Record<string, number[]>>({}).pipe(
          tap(() => PortfolioDataFetcher.LOGGER.error(err))
        )
      )
    );
  }

  private getYahooChartJson(url: string, signal?: AbortSignal) {
    return from(
      fetch(url, {
        headers: {
          "User-Agent": PortfolioDataFetcher.USER_AGENT,
        }, // 防擋
        signal,
      })
    ).pipe(
      switchMap((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return from(response.json());
      }),
      map((r) => PortfolioDataFetcher.ChartResponseSchema.parse(r)),
      map((data) => {
        if (data.chart.error) {
          throw new Error(`API Error: ${data.chart.error?.code}`);
        }
        const closes = PortfolioDataFetcher.extractClosed(data);
        if (closes.length < 2) {
          throw new Error(`Insufficient data for ${url}`);
        }
        return data;
      })
    );
  }
}
