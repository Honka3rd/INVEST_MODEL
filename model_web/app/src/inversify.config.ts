import { Container } from "inversify";
import "reflect-metadata";
import { AssetsAPI } from "./api/assets";
import { SurAssetFetcher } from "./api/fetcher";
import { MetricsAPI } from "./api/metrics";
import { AssetDataControl } from "./controllers/assetsDataControl";
import { CachedAssetDataControl } from "./controllers/cachedAssetDataControl";
import { CachedPapiSurDataControl } from "./controllers/cachedPapiSurDataControl";
import { MetricsDataControl } from "./controllers/metricsDataControl";
import { PapiSurDataControl } from "./controllers/papiSurDataControl";
import { FormUIControl } from "./dashboard/form/formUIControl";
import { AssetsUIControl } from "./dashboard/form/select/assetsUIControl";
import { MetricsGridUIControl } from "./dashboard/grid/gridUIControl";
import {
  CachedDataControlSelectors,
  DataControlSelectors,
} from "./inversify.selector";
import { StoreControl } from "./store";
import { OpinionsAPI } from "./api/opinions";
import { PublicOpinionDataControl } from "./controllers/publicOpinionDataControl";
import { CachedPublicOpinionDataControl } from "./controllers/cachedPublicOpinionDataControl";

export const WebBeanLookupContainer = new Container();

WebBeanLookupContainer.bind(DataControlSelectors.metrics)
  .to(MetricsDataControl)
  .inSingletonScope();
WebBeanLookupContainer.bind(DataControlSelectors.asset)
  .to(AssetDataControl)
  .inSingletonScope();
WebBeanLookupContainer.bind(DataControlSelectors.papi)
  .to(PapiSurDataControl)
  .inSingletonScope();
WebBeanLookupContainer.bind(DataControlSelectors.opinions)
  .to(PublicOpinionDataControl)
  .inSingletonScope();

WebBeanLookupContainer.bind(CachedDataControlSelectors.cachedAsset)
  .to(CachedAssetDataControl)
  .inSingletonScope();
WebBeanLookupContainer.bind(CachedDataControlSelectors.cachedPapi)
  .to(CachedPapiSurDataControl)
  .inSingletonScope();
WebBeanLookupContainer.bind(CachedDataControlSelectors.cachedOpinions)
  .to(CachedPublicOpinionDataControl)
  .inSingletonScope();

WebBeanLookupContainer.bind(MetricsAPI).toSelf().inSingletonScope();
WebBeanLookupContainer.bind(StoreControl).toSelf().inSingletonScope();
WebBeanLookupContainer.bind(MetricsGridUIControl).toSelf().inSingletonScope();
WebBeanLookupContainer.bind(AssetsAPI).toSelf().inSingletonScope();
WebBeanLookupContainer.bind(AssetsUIControl).toSelf().inSingletonScope();
WebBeanLookupContainer.bind(FormUIControl).toSelf().inSingletonScope();
WebBeanLookupContainer.bind(SurAssetFetcher).toSelf().inSingletonScope();
WebBeanLookupContainer.bind(OpinionsAPI).toSelf().inSingletonScope();

