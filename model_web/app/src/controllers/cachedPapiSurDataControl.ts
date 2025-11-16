import { isEmpty } from "lodash";
import type { FinnhubAsset } from "../api/assets";
import { PapiSurDataControl } from "./papiSurDataControl";
import { inject, injectable } from "inversify";
import { StoreControl } from "../store";
import type { CachedDataControl } from "./baseDataControl";
import { DataControlSelectors } from "../inversify.selector";

@injectable()
export class CachedPapiSurDataControl
  implements CachedDataControl<FinnhubAsset, string | null>
{
  constructor(
    @inject(DataControlSelectors.papi)
    private readonly papisurDataControl: PapiSurDataControl,
    @inject(StoreControl) protected readonly store: StoreControl
  ) {}

  invoke(asset: FinnhubAsset): void {
    const papis = this.store.getSurpapiContent(asset.symbol);
    if (isEmpty(papis)) {
      this.papisurDataControl.invoke(asset);
    }
  }

  cleanData(asset?: FinnhubAsset) {
    if (asset) {
        this.store.resetSurpapiContent(asset.symbol);
    } else {
        this.store.resetSurpapiContentAll();
    }
    return this;
  }

  syncData() {
    return this.papisurDataControl.syncData();
  }
}
