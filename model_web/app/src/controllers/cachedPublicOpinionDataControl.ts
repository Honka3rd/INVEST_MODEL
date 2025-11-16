import { inject, injectable } from "inversify";
import type { FinnhubAsset } from "../api/assets";
import type { CachedDataControl } from "./baseDataControl";
import type { PublicOpinions } from "../api/opinions";
import { DataControlSelectors } from "../inversify.selector";
import type { PublicOpinionDataControl } from "./publicOpinionDataControl";
import { StoreControl } from "../store";
import { isUndefined } from "lodash";

@injectable()
export class CachedPublicOpinionDataControl
  implements CachedDataControl<FinnhubAsset, PublicOpinions | null>
{
  constructor(
    @inject(DataControlSelectors.opinions)
    private readonly opinionsDataControl: PublicOpinionDataControl,
    @inject(StoreControl) protected readonly store: StoreControl
  ) {}

  cleanData(asset?: FinnhubAsset) {
    if (asset) {
      this.store.resetPublicOpinions(asset.symbol);
    } else {
      this.store.resetPublicOpinionsAll();
    }

    return this;
  }

  invoke(asset: FinnhubAsset): void {
    const opinions = this.store.getPublicOpinions(asset.symbol);
    if (isUndefined(opinions)) {
      this.opinionsDataControl.invoke(asset);
    }
  }

  syncData() {
    return this.opinionsDataControl.syncData();
  }
}
