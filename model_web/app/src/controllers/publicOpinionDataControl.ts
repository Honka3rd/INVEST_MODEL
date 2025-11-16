import { catchError, of, switchMap, tap, type Observable } from "rxjs";
import type { FinnhubAsset } from "../api/assets";
import { StoreControl } from "../store";
import { AbstractDataControl } from "./abstractDataControl";
import { inject, injectable } from "inversify";
import { OpinionsAPI, type PublicOpinions } from "../api/opinions";

@injectable()
export class PublicOpinionDataControl extends AbstractDataControl<
  FinnhubAsset,
  PublicOpinions | null
> {
  constructor(
    @inject(StoreControl) protected readonly store: StoreControl,
    @inject(OpinionsAPI) private readonly opinionAPI: OpinionsAPI
  ) {
    super();
  }

  invoke(param: FinnhubAsset): void {
    this.trigger.next(param);
  }

  syncData(): Observable<PublicOpinions | null> {
    return this.trigger.asObservable().pipe(
      tap(() => this.store.setLoading(true)),
      switchMap((asset) =>
        this.opinionAPI.opinions(asset, this.store.getLanguage()).pipe(
          tap(() => this.store.setLoading(false)),
          tap((result) => this.store.setPublicOpinions(asset.symbol, result)),
          catchError((err) => {
            console.error("獲取指標數據時出錯:", err);
            return of(null).pipe(tap(() => this.store.setLoading(false)));
          })
        )
      )
    );
  }
}
