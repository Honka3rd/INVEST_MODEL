import { useEffect } from "react";
import type { Observable } from "rxjs";

export const useObservable = <T>(
  o: Observable<T>,
  observer?: (arg: T) => void
) => {
  useEffect(() => {
    const subscription = o.subscribe(observer);
    return () => subscription.unsubscribe();
  }, []);
};

export const useMount = (fn: () => void) => {
  useEffect(() => {
    fn();
  }, []);
};
