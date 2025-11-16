import { Observable, Subject } from "rxjs";
import type { DataControl } from "./baseDataControl";

export abstract class AbstractDataControl<P, D> implements DataControl<P, D> {
    protected readonly trigger = new Subject<P>();

    abstract invoke(param: P): void;

    abstract syncData(): Observable<D>;
}