import type { Observable } from "rxjs";

export interface DataControl<P, D> {
    invoke(param?: P): void;
    syncData(): Observable<D>
}

export interface CachedDataControl<P, D> extends DataControl<P, D> {
    cleanData(aram?: P): CachedDataControl<P, D>
}