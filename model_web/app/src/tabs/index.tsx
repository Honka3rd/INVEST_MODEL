import { useEffect, useMemo, useRef, type ComponentRef, type FC } from "react";
import { FinancialTabs, FlexContainer, TabPanel } from "../dashboard/ui";
import { WebBeanLookupContainer } from "../inversify.config";
import { StoreControl } from "../store";
import Allocation from "../dashboard/grid";
import { ControlledMetricsViz } from "../dashboard/chart";
import { DashboardForm } from "../dashboard/form";
import { ControlledLegend } from "../dashboard/legends";
import {
  useAnalyzedContent,
  useAssetTabs,
  useOpinionIndex,
  useOpinions,
  useSelectedTab,
} from "../observers";
import type { DynamicTabProps, TabChange } from "./types";
import { Tab, Tabs, Typography, useEventCallback } from "@mui/material";
import { useObservable } from "../hooks";
import { CachedDataControlSelectors } from "../inversify.selector";
import { isEmpty } from "lodash";

export const DynamicFinnAssetTab: FC<DynamicTabProps> = (props) => {
  const papiSurSvc = WebBeanLookupContainer.get(
    CachedDataControlSelectors.cachedPapi
  );
  const opinionsSvc = WebBeanLookupContainer.get(
    CachedDataControlSelectors.cachedOpinions
  );

  const store = WebBeanLookupContainer.get(StoreControl);

  const isActive = useMemo(
    () => props.value === props.currentValue,
    [props.value, props.currentValue]
  );

  useEffect(() => {
    if (isActive) {
      papiSurSvc.invoke(props);
    }
  }, [isActive]);
  const ref = useRef<ComponentRef<"div">>(null);

  useEffect(() => {
    const element = ref.current;
    if (props.analyzed && element && isActive) {
      const content = document.createElement("div");
      content.className = "AI_analyzed";
      content.innerHTML = props.analyzed.serpapi;
      element.appendChild(content);
      if (!isEmpty(props.analyzed.serpapi) && !props.analyzed.opinions) {
        opinionsSvc.invoke(props);
      }

      return () => {
        element.removeChild(content);
      };
    }
  }, [props.analyzed, isActive]);
  const opinIdx = useOpinionIndex(props.symbol);
  const opinions = useOpinions(props.symbol);
  const neutralRef = useRef<ComponentRef<"div">>(null);
  const popularRef = useRef<ComponentRef<"div">>(null);
  const professionalRef = useRef<ComponentRef<"div">>(null);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    switch (opinIdx) {
      case 0:
        const neutral = neutralRef.current;
        if (neutral) {
          const child = document.createElement("div");
          child.innerHTML = opinions.neutral;
          neutral.appendChild(child);
          return () => {
            neutral.removeChild(child);
          };
        }
        break;
      case 1:
        const popular = popularRef.current;
        if (popular) {
          const child = document.createElement("div");
          child.innerHTML = opinions.popular;
          popular.appendChild(child);
          return () => {
            popular.removeChild(child);
          };
        }
        break;
      case 2:
        const professional = professionalRef.current;
        if (professional) {
          const child = document.createElement("div");
          child.innerHTML = opinions.professional;
          professional.appendChild(child);
          return () => {
            professional.removeChild(child);
          };
        }
        break;
    }
  }, [opinIdx, opinions, isActive]);

  return (
    <TabPanel index={props.value} value={props.currentValue}>
      <Typography>Asset Name: {props.description}</Typography>
      <div ref={ref} />
      <Tabs
        value={opinIdx}
        onChange={(_e, v) => store.setOpiIndex(props.symbol, v)}
        variant="scrollable" // 支持后续添加更多tab时滚动
        scrollButtons="auto" // 自动显示滚动按钮
        aria-label="舆情 Tabs"
      >
        <Tab label="Neutral" value={0} />
        <Tab label="Popular" value={1} />
        <Tab label="Professional" value={2} />
      </Tabs>
      <TabPanel index={0} value={opinIdx}>
        <div className="neutral" ref={neutralRef} />
      </TabPanel>
      <TabPanel index={1} value={opinIdx}>
        <div className="popular" ref={popularRef} />
      </TabPanel>
      <TabPanel index={2} value={opinIdx}>
        <div className="professional" ref={professionalRef} />
      </TabPanel>
    </TabPanel>
  );
};

export const ControlledTabs: FC = () => {
  const store = WebBeanLookupContainer.get(StoreControl);
  const papiSurSvc = WebBeanLookupContainer.get(
    CachedDataControlSelectors.cachedPapi
  );
  const opinionsSvc = WebBeanLookupContainer.get(
    CachedDataControlSelectors.cachedOpinions
  );

  useObservable(papiSurSvc.syncData());
  useObservable(opinionsSvc.syncData());
  const focused = useSelectedTab();
  const options = useAssetTabs();
  const onChange: TabChange = useEventCallback((_, v) => {
    const tab = options.find((opt) => opt.value === v);
    if (tab) {
      store.setTab(tab);
    }
  });
  const [portfolio, ...tabPropsList] = options;
  const details = useAnalyzedContent();

  return (
    <FinancialTabs value={focused.value} options={options} onChange={onChange}>
      <TabPanel index={portfolio.value} value={focused.value}>
        <DashboardForm />
        <FlexContainer>
          <Allocation />
          <ControlledMetricsViz />
        </FlexContainer>
        <ControlledLegend />
      </TabPanel>
      {tabPropsList.map((props) => (
        <DynamicFinnAssetTab
          {...props}
          currentValue={focused.value}
          key={props.symbol}
          analyzed={details[props.symbol]}
        />
      ))}
    </FinancialTabs>
  );
};
