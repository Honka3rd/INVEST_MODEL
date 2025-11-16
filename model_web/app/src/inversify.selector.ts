import type { ServiceIdentifier } from "inversify";
import type { FinnhubAsset, FinnhubAssets } from "./api/assets";
import type { Metrics, PortfolioMetricsParams } from "./api/metrics";
import type {
  DataControl,
  CachedDataControl,
} from "./controllers/baseDataControl";
import type { PublicOpinions } from "./api/opinions";

export const DataControlSelectors = Object.freeze({
  metrics: Symbol("MetricsDataControl") as ServiceIdentifier<
    DataControl<PortfolioMetricsParams, Metrics | null>
  >,
  asset: Symbol("AssetDataControl") as ServiceIdentifier<
    DataControl<void, FinnhubAssets | null>
  >,
  papi: Symbol("PapiSurDataControl") as ServiceIdentifier<
    DataControl<FinnhubAsset, string | null>
  >,
  opinions: Symbol("PublicOpinionDataControl") as ServiceIdentifier<
    DataControl<FinnhubAsset, PublicOpinions | null>
  >,
});

export const CachedDataControlSelectors = Object.freeze({
  cachedAsset: Symbol("CachedAssetDataControl") as ServiceIdentifier<
    CachedDataControl<void, FinnhubAssets | null>
  >,
  cachedPapi: Symbol("CachedPapiSurDataControl") as ServiceIdentifier<
    CachedDataControl<FinnhubAsset, string | null>
  >,
  cachedOpinions: Symbol("CachedPublicOpinionDataControl") as ServiceIdentifier<
    CachedDataControl<FinnhubAsset, PublicOpinions | null>
  >,
});
