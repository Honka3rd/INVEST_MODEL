import { injectable } from "inversify";
import { isEmpty, memoize, omit } from "lodash";
import { NRS } from "rx-store-core";
import type { Metrics, PortfolioMetricsParams } from "./api/metrics";
import { stateObserverManager } from "rx-store-react";
import type { FinnhubAssets } from "./api/assets";
import type { PublicOpinions } from "./api/opinions";
import { PORTFOLIO_ASSET } from "./observers";
import type { TabProps } from "./tabs/types";
import { LanguageE } from "@shared/LanguageE";

export type AnalyzedAssetContent = {
  serpapi: string;
  opiIdx: number;
  opinions?: PublicOpinions;
};

@injectable()
export class StoreControl {
  private readonly store = NRS({
    metrics: (): Metrics => ({
      weights: {},
      amounts: {},
      portfolioReturn: 0,
      portfolioRisk: 0,
      sharpe: 0,
    }),
    params: (): PortfolioMetricsParams => ({
      symbols: [],
      period: "1y",
      interval: "1d",
      totalAssets: 1000000,
    }),
    assets: (): FinnhubAssets => [],
    loading: (): boolean => false,
    tab: (): TabProps => PORTFOLIO_ASSET(),
    assetAnalyzedInfo: (): Record<string, AnalyzedAssetContent> => ({}),
    lang: (): LanguageE => LanguageE.ENGLISH,
  });

  getMetrics() {
    return this.store.getState("metrics");
  }

  setMetrics(metrics: Metrics) {
    this.store.setState({ metrics });
  }

  resetMetrics() {
    this.store.reset("metrics");
  }

  getParams() {
    return this.store.getState("params");
  }

  setParams(params: PortfolioMetricsParams) {
    this.store.setState({ params });
  }

  resetParams() {
    this.store.reset("params");
  }

  getAssets() {
    return this.store.getState("assets");
  }

  hasAssets() {
    return !isEmpty(this.getAssets());
  }

  setAssets(assets: FinnhubAssets) {
    this.store.setState({ assets });
  }

  resetAssets() {
    this.store.reset("assets");
  }

  setLoading(loading: boolean) {
    this.store.setState({ loading });
  }

  isLoading() {
    return this.store.getState("loading");
  }

  resetLoading() {
    this.store.reset("loading");
  }

  getTab() {
    return this.store.getState("tab");
  }

  setTab(tab: TabProps) {
    this.store.setState({ tab });
  }

  getAnalyzedContents() {
    return this.store.getState("assetAnalyzedInfo");
  }

  setAnalyzedContents(content: Record<string, AnalyzedAssetContent>) {
    this.store.setState({ assetAnalyzedInfo: content });
  }

  getSurpapiContent(symbol: string) {
    const analyzed = this.getAnalyzedContents()[symbol];
    if (analyzed) {
      return analyzed.serpapi;
    }
    return "";
  }

  setSurpapiContent(symbol: string, content: string) {
    const copied = { ...this.getAnalyzedContents() };
    copied[symbol] = {
      ...copied[symbol],
      serpapi: content,
    };
    this.setAnalyzedContents(copied);
  }

  resetSurpapiContent(symbol: string) {
    this.setSurpapiContent(symbol, "");
  }

  resetSurpapiContentAll() {
    const symbols = this.getParams().symbols;
    const copied = { ...this.getAnalyzedContents() };
    for (const symbol of symbols) {
      copied[symbol] = {
        ...copied[symbol],
        serpapi: "",
      };
    }
    this.setAnalyzedContents(copied);
  }

  getPublicOpinions(symbol: string) {
    const analyzed = this.getAnalyzedContents()[symbol];
    if (analyzed) {
      return analyzed.opinions;
    }
  }

  setPublicOpinions(symbol: string, opinions: PublicOpinions) {
    const copied = { ...this.getAnalyzedContents() };
    copied[symbol] = {
      ...copied[symbol],
      opinions,
    };
    this.setAnalyzedContents(copied);
  }

  resetPublicOpinions(symbol: string) {
    const contents = this.getAnalyzedContents();
    const content = contents[symbol];
    if (content) {
      const copied = { ...contents };
      copied[symbol] = omit(content, ["opinions"]);
      this.setAnalyzedContents(copied);
    }
  }

  resetPublicOpinionsAll() {
    const contents = this.getAnalyzedContents();
    const copied = { ...contents };
    for (const symbol of this.getParams().symbols) {
      const content = copied[symbol];
      copied[symbol] = omit(content, ["opinions"]);
    }

    this.setAnalyzedContents(copied);
  }

  resetAllAnalyzedContents() {
    this.resetParams();
    this.resetPublicOpinionsAll();
    this.resetSurpapiContentAll();
  }

  getOpiIndex(symbol: string) {
    const analyzed = this.getAnalyzedContents()[symbol];
    if (analyzed) {
      return analyzed.opiIdx;
    }
    return 0;
  }

  setOpiIndex(symbol: string, index: number) {
    const copied = { ...this.getAnalyzedContents() };
    if (index < 0 || isNaN(index)) {
      return;
    }
    copied[symbol] = {
      ...copied[symbol],
      opiIdx: index,
    };
    this.setAnalyzedContents(copied);
  }

  getFocusedTab(assets: FinnhubAssets = this.getAssets(), tab = this.getTab()) {
    return assets.find((asset) => asset.symbol === tab.symbol);
  }

  getLanguage() {
    return this.store.getState("lang");
  }

  setLanguage(lang: LanguageE) {
    this.store.setState({ lang });
  }

  resetLanguage() {
    this.store.reset("lang");
  } 

  get() {
    return this.store;
  }

  readonly observers = memoize(() => {
    return stateObserverManager(this.store);
  });
}
