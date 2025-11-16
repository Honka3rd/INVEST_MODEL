import { inject, injectable } from "inversify";
import { StoreControl } from "../../store";
import { MetricsAPI, type Interval, type Period } from "../../api/metrics";
import z from "zod";

@injectable()
export class FormUIControl {
  private readonly totalAssetSchema = z.number().min(1, "总资产必须大于0");
  constructor(
    @inject(StoreControl) private readonly storeControl: StoreControl,
    @inject(MetricsAPI) private readonly metricsAPI: MetricsAPI
  ) {}

  isValidPeriod(period: string): period is Period {
    return this.metricsAPI.isValidPeriod(period);
  }

  isValidInterval(interval: string): interval is Interval {
    return this.metricsAPI.isValidInterval(interval);
  }

  isValidTotalAssets(totalAssets: number) {
    const result = this.totalAssetSchema.safeParse(totalAssets);
    return result.success;
  } 

  getPeriod() {
    return this.storeControl.getParams().period;
  }

  setPeriod(period: Period) {
    this.storeControl.setParams({
      ...this.storeControl.getParams(),
      period,
    });
  }

  getInterval() {
    return this.storeControl.getParams().interval;
  }

  setInterval(interval: Interval) {
    this.storeControl.setParams({
      ...this.storeControl.getParams(),
      interval,
    });
  }

  getTotalAssets() {
    return this.storeControl.getParams().totalAssets;
  }

  setTotalAssets(totalAssets: number) {
    this.storeControl.setParams({
      ...this.storeControl.getParams(),
      totalAssets,
    });
  }
}
