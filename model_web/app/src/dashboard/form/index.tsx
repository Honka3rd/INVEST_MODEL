import type { FC } from "react";
import { ControlledIntervalInput } from "./interval";
import { ControlledPeriodInput } from "./period";
import { ControlledTotalInput } from "./total";
import AssetSelector from "./select";
import { WebBeanLookupContainer } from "../../inversify.config";
import { ControlledSubmit } from "./submit";
import {
  CachedDataControlSelectors,
  DataControlSelectors,
} from "../../inversify.selector";
import { LanguageSelect } from "./translation";

export const DashboardForm: FC = () => {
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          WebBeanLookupContainer.get(DataControlSelectors.metrics).invoke();
          WebBeanLookupContainer.get(
            CachedDataControlSelectors.cachedOpinions
          ).cleanData();
          WebBeanLookupContainer.get(
            CachedDataControlSelectors.cachedPapi
          ).cleanData();
        }}
        style={{
          display: "flex",
          gap: "1em",
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        <AssetSelector />
        <ControlledIntervalInput />
        <ControlledPeriodInput />
        <ControlledTotalInput />
        <ControlledSubmit />
      </form>
      <LanguageSelect />
    </>
  );
};
