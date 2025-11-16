import { type FC } from "react";
import {
  WebBeanLookupContainer,
} from "../../inversify.config";
import { MetricsGridUIControl } from "./gridUIControl";
import AllocationDataGrid from "./ui";
import { useObservable } from "../../hooks";
import { useAssetRows } from "../../observers";
import { DataControlSelectors } from "../../inversify.selector";

const Allocation: FC = () => {
  const gridUIControl = WebBeanLookupContainer.get(MetricsGridUIControl);
  const metricsDataControl = WebBeanLookupContainer.get(
    DataControlSelectors.metrics
  );
  const rows = useAssetRows();
  const columns = gridUIControl.useColumns();
  useObservable(metricsDataControl.syncData());
  return <AllocationDataGrid rows={rows} columns={columns} />;
};
export default Allocation;
