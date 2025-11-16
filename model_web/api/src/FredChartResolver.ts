import { inject, injectable } from "inversify";
import z from "zod";
import {
  AllocationInput,
  Interval,
  Period,
  Series,
  SharpeResult,
} from "./types";
import { forkJoin, from, map, Observable, switchMap } from "rxjs";
import { FredRFDataResolver } from "./FredRFDataResolver";

@injectable()
export class FredChartResolver {
  static readonly YahooChartSchema = z
    .object({
      chart: z.object({
        result: z.array(
          z.object({
            meta: z.object({ symbol: z.string() }),
            timestamp: z.array(z.number()),
            indicators: z.object({
              adjclose: z.array(
                z.object({ adjclose: z.array(z.number().nullable()) })
              ),
            }),
          })
        ),
        error: z.any().nullable(),
      }),
    })
    .loose();

  constructor(
    @inject(FredRFDataResolver)
    private readonly fredRFDataResolver: FredRFDataResolver
  ) {}

  private makeFredURL(
    symbol: string,
    range: Period = "1y",
    interval: Interval = "1d"
  ) {
    const apiKey = process.env.FRED_API_KEY;
    if (!apiKey) throw new Error("Missing FRED_API_KEY");
    const base = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}`;
    const qp = new URLSearchParams({
      range,
      interval,
      includePrePost: "false",
      events: "div%2Csplit",
      api_key: apiKey,
      file_type: "json",
    });
    return `${base}?${qp.toString()}`;
  }

  private resolveBySymbol(
    symbol: string,
    range: Period = "1y",
    interval: Interval = "1d"
  ) {
    return from(
      fetch(this.makeFredURL(symbol, range, interval), {
        headers: { "User-Agent": "MPT-API/1.0" },
      })
    ).pipe(
      map((r) => {
        if (!r.ok)
          throw new Error(`HTTP Yahoo status ${r.status} for ${symbol}`);
        return r;
      }),
      switchMap((r) => from(r.json())),
      map((json) => FredChartResolver.YahooChartSchema.parse(json)),
      map(({ chart }) => {
        const res = chart.result?.[0];
        if (!res) throw new Error(`Empty result for ${symbol}`);
        const ts = res.timestamp ?? [];
        const adj = res.indicators.adjclose?.[0]?.adjclose ?? [];
        if (ts.length !== adj.length)
          throw new Error(`Length mismatch for ${symbol}`);
        // 濾掉 null
        const dates: string[] = [];
        const prices: number[] = [];
        for (let i = 0; i < ts.length; i++) {
          const v = adj[i];
          if (v != null) {
            const d = new Date(ts[i] * 1000).toISOString().slice(0, 10); // YYYY-MM-DD
            dates.push(d);
            prices.push(v);
          }
        }
        // 轉日報酬
        const returns: number[] = [];
        for (let i = 1; i < prices.length; i++) {
          const r = prices[i] / prices[i - 1] - 1;
          returns.push(isFinite(r) ? r : 0);
        }
        // returns 少一天，對齊日期
        return {
          symbol,
          dates: dates.slice(1),
          prices: prices.slice(1),
          returns,
        };
      })
    );
  }

  private intersectDates(seriesList: Series[]): {
    dates: string[];
    matrix: number[][];
  } {
    // 建立日期到各資產報酬的對齊
    const dateSets = seriesList.map((s) => new Set(s.dates));
    const common = [...seriesList[0].dates].filter((d) =>
      dateSets.every((set) => set.has(d))
    );
    common.sort(); // 升冪

    const symbolToIndex = new Map<string, number>();
    seriesList.forEach((s, idx) => symbolToIndex.set(s.symbol, idx));

    // 先建每資產日期->報酬 map
    const maps = seriesList.map((s) => {
      const m = new Map<string, number>();
      for (let i = 0; i < s.dates.length; i++) m.set(s.dates[i], s.returns[i]);
      return m;
    });

    const matrix: number[][] = common.map((d) =>
      maps.map((m) => {
        const v = m.get(d);
        if (v == null || !isFinite(v)) return 0;
        return v;
      })
    );

    return { dates: common, matrix };
  }

  private statsMeanStd(x: number[]): { mean: number; std: number } {
    const n = x.length;
    if (n === 0) return { mean: 0, std: 0 };
    const mean = x.reduce((a, b) => a + b, 0) / n;
    const var_ =
      x.reduce((s, v) => s + (v - mean) * (v - mean), 0) / (n - 1 || 1);
    return { mean, std: Math.sqrt(var_) };
  }

  resolve(
    allocations: AllocationInput,
    opts?: { range?: Period; tradingDaysPerYear?: number }
  ): Observable<SharpeResult> {
    const range = opts?.range ?? "1y";
    const N = opts?.tradingDaysPerYear ?? 252;

    const entries = Object.entries(allocations).filter(([, amt]) => amt > 0);
    if (entries.length === 0) throw new Error("Empty allocations");
    const total = entries.reduce((s, [, amt]) => s + amt, 0);
    const weights = Object.fromEntries(
      entries.map(([sym, amt]) => [sym, amt / total])
    );

    const price$ = forkJoin(
      entries.map(([sym]) => this.resolveBySymbol(sym, range, "1d"))
    );
    const rf$ = new FredRFDataResolver().resolve();

    return forkJoin([price$, rf$]).pipe(
      map(([seriesList, rfMeta]) => {
        // 對齊日期
        const { dates, matrix } = this.intersectDates(seriesList);
        if (dates.length < 30)
          throw new Error("Too few overlapping observations");

        // 權重向量順序按 seriesList
        const wVec = seriesList.map((s) => weights[s.symbol] ?? 0);

        // 組合日報酬
        const portR: number[] = matrix.map((row) =>
          row.reduce((s, r, i) => s + wVec[i] * r, 0)
        );

        // 無風險率轉日化
        const rfAnnual = rfMeta.rf; // e.g., 0.0536
        const rfDaily = Math.pow(1 + rfAnnual, 1 / N) - 1;

        // 超額報酬
        const excess = portR.map((r) => r - rfDaily);

        const { mean, std } = this.statsMeanStd(excess);
        const sharpeDaily = std === 0 ? 0 : mean / std;
        const sharpeAnnual = sharpeDaily * Math.sqrt(N);

        return {
          windowDays: dates.length,
          nObs: dates.length,
          sharpeDaily,
          sharpeAnnual,
          meanExcessDaily: mean,
          stdDaily: std,
          rfAnnual,
          rfDaily,
          start: dates[0],
          end: dates[dates.length - 1],
          weights,
        };
      })
    );
  }
}
