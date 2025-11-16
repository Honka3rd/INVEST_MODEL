import { MetricsGridUIControl } from "./dashboard/grid/gridUIControl";
import { WebBeanLookupContainer } from "./inversify.config";
import { StoreControl } from "./store";
import type { TabProps } from "./tabs/types";
import { isUndefined, memoize } from "lodash";

export const useAssets = () => {
  const store = WebBeanLookupContainer.get(StoreControl);
  const observers = store.observers();
  return observers.useObservableState("assets")[0];
};

export const useSymbols = () => {
  const assets = useAssets();
  return assets.map((asset) => asset.symbol);
};

export const useParams = () => {
  const observers = WebBeanLookupContainer.get(StoreControl).observers();
  return observers.useObservableState("params")[0];
};

export const useSelectedSymbols = () => {
  return useParams().symbols;
};

export const PORTFOLIO = "PORTFOLIO";
export const PORTFOLIO_ID = 0;
export const PORTFOLIO_ASSET = memoize(
  (): TabProps => ({
    symbol: PORTFOLIO,
    description: "Portfolio Model",
    currency: "",
    displaySymbol: "",
    figi: null,
    isin: null,
    mic: "",
    shareClassFIGI: null,
    symbol2: "",
    type: "",
    value: PORTFOLIO_ID,
    label: "Portfolio",
  })
);

export const useAssetTabs = (): TabProps[] => {
  const symbols = useSelectedSymbols();
  const assets = useAssets();
  const portfolio: TabProps = PORTFOLIO_ASSET();
  return [
    portfolio,
    ...assets
      .map((asset, i) => ({ ...asset, value: i + 1, label: asset.symbol }))
      .filter((asset) => symbols.includes(asset.symbol)),
  ];
};

export const usePeriod = () => {
  return useParams().period;
};

export const useInterval = () => {
  return useParams().interval;
};

export const useTotalAssets = () => {
  return useParams().totalAssets;
};

export const useMetrics = () => {
  const observers = WebBeanLookupContainer.get(StoreControl).observers();
  return observers.useObservableState("metrics")[0];
};

export const usePortfolioReturn = () => {
  return useMetrics().portfolioReturn;
};

export const usePortfolioRisk = () => {
  return useMetrics().portfolioRisk;
};

export const useSharpe = () => {
  return useMetrics().sharpe;
};

export const useWeights = () => {
  return useMetrics().weights;
};

export const useAmounts = () => {
  return useMetrics().amounts;
};

export const useSelectedTab = () => {
  const observers = WebBeanLookupContainer.get(StoreControl).observers();
  return observers.useObservableState("tab")[0];
};

export const useAnalyzedContent = () => {
  const observers = WebBeanLookupContainer.get(StoreControl).observers();
  return observers.useObservableState("assetAnalyzedInfo")[0];
};

export const useOpinions = (symbol: string) => {
  const analyzed = useAnalyzedContent();
  const opinions = analyzed[symbol]?.opinions;
  return opinions
    ? opinions
    : {
        neutral: "",
        popular: "",
        professional: "",
      };
};

export const useOpinionIndex = (symbol: string) => {
  const analyzed = useAnalyzedContent();
  const index = analyzed[symbol]?.opiIdx;
  return isUndefined(index) ? 0 : index;
};

export const useAssetRows = () => {
  const metrics = useMetrics();
  const metricsGridUIControl = WebBeanLookupContainer.get(MetricsGridUIControl);
  return metricsGridUIControl.rows(metrics);
};

export const useLoading = () => {
  const observers = WebBeanLookupContainer.get(StoreControl).observers();
  return observers.useObservableState("loading")[0];
};

export const useLanguage= () => {
  const observers = WebBeanLookupContainer.get(StoreControl).observers();
  return observers.useObservableState('lang')[0];
};
