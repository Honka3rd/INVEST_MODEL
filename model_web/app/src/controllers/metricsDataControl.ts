import { inject, injectable } from "inversify";
import {
  MetricsAPI,
  type Metrics,
  type PortfolioMetricsParams,
} from "../api/metrics";
import { StoreControl } from "../store";
import { catchError, of, switchMap, tap } from "rxjs";
import { AbstractDataControl } from "./abstractDataControl";

export type MetricsRow = {
  asset: string;
  weight: number;
  amount: number;
};
@injectable()
export class MetricsDataControl extends AbstractDataControl<
  PortfolioMetricsParams,
  Metrics | null
> {
  constructor(
    @inject(MetricsAPI) private readonly metricsAPI: MetricsAPI,
    @inject(StoreControl) private readonly storeControl: StoreControl
  ) {
    super();
  }

  private isValidParams(params: PortfolioMetricsParams) {
    return (
      this.metricsAPI.isValidSymbols(params.symbols) &&
      this.metricsAPI.isValidPeriod(params.period) &&
      this.metricsAPI.isValidInterval(params.interval) &&
      params.totalAssets > 0
    );
  }

  invoke(params = this.storeControl.getParams()) {
    if (!this.isValidParams(params)) {
      return;
    }
    this.storeControl.setLoading(true);
    this.trigger.next(params);
  }

  syncData() {
    return this.trigger.asObservable().pipe(
      switchMap((params) =>
        this.metricsAPI.metrics(params).pipe(
          tap(() => this.storeControl.setLoading(false)),
          tap((metrics) => this.storeControl.setMetrics(metrics)),
          catchError((err) => {
            console.error("獲取指標數據時出錯:", err);
            return of(null).pipe(
              tap(() => this.storeControl.setLoading(false))
            );
          })
        )
      )
    );
  }
}
