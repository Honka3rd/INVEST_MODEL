import { inject, injectable } from "inversify";
import { catchError, of, switchMap, tap } from "rxjs";
import { AssetsAPI, type FinnhubAssets } from "../api/assets";
import { StoreControl } from "../store";
import { defer } from "lodash";
import { AbstractDataControl } from "./abstractDataControl";

@injectable()
export class AssetDataControl extends AbstractDataControl<
  void,
  FinnhubAssets | null
> {
  constructor(
    @inject(AssetsAPI) private readonly assetsPI: AssetsAPI,
    @inject(StoreControl) protected readonly storeControl: StoreControl
  ) {
    super();
  }

  invoke() {
    defer(() => {
      this.trigger.next();
    });
  }

  syncData() {
    return this.trigger.asObservable().pipe(
      tap(() => this.storeControl.setLoading(true)),
      switchMap(() =>
        this.assetsPI.assets().pipe(
          tap(() => this.storeControl.setLoading(false)),
          tap((assets) => this.storeControl.setAssets(assets)),
          catchError((err) => {
            console.error("獲取資產數據時出錯:", err);
            return of(null).pipe(
              tap(() => this.storeControl.setLoading(false))
            );
          })
        )
      )
    );
  }
}
