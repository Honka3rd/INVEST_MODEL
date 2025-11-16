import "reflect-metadata";
import { Container } from "inversify";
import { PortfolioDataFetcher } from "./PortfolioDataFetcher";
import { PortfolioMetricsCalculator } from "./PortfolioMetricsCalculator";
import { PortfolioMetricsProvider } from "./PortfolioMetricsProvider";
import { FredRFDataResolver } from "./FredRFDataResolver";
import { AssetAllocator } from "./AssetAllocator";
import { FinnhubAssetResolver } from "./FinnhubAssetResolver";
import { SurPapiDataFetcher } from "./SurPapiDataFetcher";
import { GoogleLLMResolver } from "./GoogleLLMResolver";
import { PublicOpinionDataResolver } from "./PublicOpinionDataResolver";
import { FredChartResolver } from "./FredChartResolver";

export const ControllerLookupContainer = new Container();

ControllerLookupContainer.bind(FredRFDataResolver).toSelf().inSingletonScope();
ControllerLookupContainer.bind(PortfolioDataFetcher).toSelf().inSingletonScope();
ControllerLookupContainer.bind(PortfolioMetricsCalculator).toSelf().inSingletonScope();
ControllerLookupContainer.bind(PortfolioMetricsProvider).toSelf().inSingletonScope();
ControllerLookupContainer.bind(AssetAllocator).toSelf().inSingletonScope();
ControllerLookupContainer.bind(FinnhubAssetResolver).toSelf().inSingletonScope();
ControllerLookupContainer.bind(SurPapiDataFetcher).toSelf().inSingletonScope();
ControllerLookupContainer.bind(GoogleLLMResolver).toSelf().inSingletonScope();
ControllerLookupContainer.bind(PublicOpinionDataResolver).toSelf().inSingletonScope();
ControllerLookupContainer.bind(FredChartResolver).toSelf().inSingletonScope();