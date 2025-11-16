import { inject, injectable } from "inversify";
import { type MetricsRow } from "../../controllers/metricsDataControl";
import type { Metrics } from "../../api/metrics";
import { keys } from "lodash";
import type { GridColDef } from "@mui/x-data-grid";
import { StoreControl } from "../../store";
import { useTranslation } from "react-i18next";

@injectable()
export class MetricsGridUIControl {
  constructor(
    @inject(StoreControl) private readonly storeControl: StoreControl
  ) {}

  useColumns(): GridColDef<MetricsRow>[] {
    const { t } = useTranslation();
    return [
      {
        field: "asset",
        headerName: t("portfolio.asset"),
        width: 150,
        sortable: true,
      },
      {
        field: "weight",
        headerName: t("portfolio.weightPercent"),
        width: 150,
        sortable: true,
        align: "right",
      },
      {
        field: "amount",
        headerName: t("portfolio.amountRMB"),
        width: 200,
        sortable: true,
        align: "right",
      },
    ];
  }

  private toMetricsRows(metrics: Metrics): MetricsRow[] {
    const symbols = keys(metrics.weights);
    return symbols.map((symbol) => ({
      asset: symbol,
      weight: metrics.weights[symbol],
      amount: metrics.amounts[symbol],
    }));
  }

  rows(metrics = this.storeControl.getMetrics()) {
    return this.toMetricsRows(metrics);
  }
}
