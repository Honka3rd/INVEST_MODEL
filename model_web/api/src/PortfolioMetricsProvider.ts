import { inject, injectable } from "inversify";
import {
  CalculationResult,
  PortfolioMetricsCalculator,
} from "./PortfolioMetricsCalculator";
import { PortfolioDataFetcher } from "./PortfolioDataFetcher";
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  Subscription,
  tap,
} from "rxjs";
import { DebugLogger, Logger } from "./logger";
import { Interval, Period } from "./types";

@injectable()
export class PortfolioMetricsProvider {
  private static readonly LOGGER: Logger = DebugLogger.getLogger(
    PortfolioMetricsProvider
  );
  private aborter = new AbortController();
  private subscription: Subscription | null = null;
  private pending: boolean = false;
  constructor(
    @inject(PortfolioMetricsCalculator)
    private readonly calculator: PortfolioMetricsCalculator,
    @inject(PortfolioDataFetcher) private readonly fetcher: PortfolioDataFetcher
  ) {}

  getMetrics(
    symbols: string[],
    period: Period,
    interval: Interval,
    onError?: (err: any) => void
  ): Observable<CalculationResult> {
    return this.fetcher
      .resolve(symbols, period, interval, this.aborter.signal)
      .pipe(
        map((prices) =>
          this.calculator.calculateFromPrices(Object.values(prices))
        ),
        catchError((err: Error) =>
          of({
            mu: new Array(symbols.length).fill(0),
            sigma: new Array(symbols.length).fill(0),
            corr: Array.from({ length: symbols.length }, () =>
              new Array(symbols.length).fill(0)
            ),
          }).pipe(
            tap(() => PortfolioMetricsProvider.LOGGER.error(err)),
            tap(() => onError?.(err))
          )
        )
      );
  }

  private clean() {
    this.pending = false;
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  abort() {
    if (this.subscription && this.pending) {
      this.clean();
      this.aborter.abort();
      this.aborter = new AbortController();
    } else {
      console.warn("No pending request to abort"); // 防误用
    }
  }

  metrics(
    symbols: string[],
    handle: (value: CalculationResult) => void,
    period: Period = "1y",
    interval: Interval = "1d",
    onError?: (err: any) => void
  ) {
    this.pending = true;
    this.subscription = this.getMetrics(symbols, period, interval, onError)
      .pipe(
        finalize(() => {
          this.clean();
        })
      )
      .subscribe(handle);
  }

  isPending() {
    return this.pending;
  }

  isValidPeriod(period: string): period is Period {
    return this.fetcher.isValidPeriod(period);
  }

  isValidInterval(interval: string): interval is Interval {
    return this.fetcher.isValidInterval(interval);
  }

  isValidSymbols(symbols: any): symbols is string[] {
    return this.fetcher.isValidSymbols(symbols);
  }
}
