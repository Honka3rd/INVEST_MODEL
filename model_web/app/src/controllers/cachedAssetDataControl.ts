import { inject, injectable } from "inversify";
import { AssetDataControl } from "./assetsDataControl";
import { StoreControl } from "../store";
import type { CachedDataControl } from "./baseDataControl";
import type { FinnhubAssets } from "../api/assets";
import { DataControlSelectors } from "../inversify.selector";

@injectable()
export class CachedAssetDataControl
  implements CachedDataControl<void, FinnhubAssets | null>
{
  constructor(
    @inject(DataControlSelectors.asset)
    private readonly assetDataControl: AssetDataControl,
    @inject(StoreControl) protected readonly store: StoreControl
  ) {}

  cleanData() {
    this.store.resetAssets()
    return this;
  }

  invoke(): void {
    if (this.store.hasAssets()) {
      return;
    }
    this.assetDataControl.invoke();
  }

  syncData() {
    return this.assetDataControl.syncData();
  }
}
