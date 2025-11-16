import type { GridColDef } from "@mui/x-data-grid";
import type { MetricsRow } from "../../controllers/metricsDataControl";

export type AllocationGridProps = {
  rows: MetricsRow[];
  columns: GridColDef<MetricsRow>[];
};
