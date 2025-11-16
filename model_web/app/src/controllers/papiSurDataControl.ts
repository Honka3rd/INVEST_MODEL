import { inject, injectable } from "inversify";
import { StoreControl } from "../store";
import { SurAssetFetcher } from "../api/fetcher";
import { catchError, of, switchMap, tap } from "rxjs";
import type { FinnhubAsset } from "../api/assets";
import { AbstractDataControl } from "./abstractDataControl";

@injectable()
export class PapiSurDataControl extends AbstractDataControl<
  FinnhubAsset,
  string | null
> {
  constructor(
    @inject(StoreControl) protected readonly store: StoreControl,
    @inject(SurAssetFetcher) private readonly surAssetFetcher: SurAssetFetcher
  ) {
    super();
  }

  private isValidQuery(symbol: string) {
    const symbos = this.store.getAssets().map((asset) => asset.symbol);
    return symbos.includes(symbol);
  }

  invoke(asset: FinnhubAsset) {
    if (this.isValidQuery(asset.symbol)) {
      this.trigger.next(asset);
    }
  }

  syncData() {
    return this.trigger.asObservable().pipe(
      tap(() => this.store.setLoading(true)),
      switchMap((asset) =>
        this.surAssetFetcher.search(asset, this.store.getLanguage()).pipe(
          tap(() => this.store.setLoading(false)),
          tap((result) => this.store.setSurpapiContent(asset.symbol, result)),
          catchError((err) => {
            console.error("獲取指標數據時出錯:", err);
            return of(null).pipe(tap(() => this.store.setLoading(false)));
          })
        )
      )
    );
  }
}
