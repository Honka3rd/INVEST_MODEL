import { inject, injectable } from "inversify";
import { memoize } from "lodash";
import { StoreControl } from "../../../store";
@injectable()
export class AssetsUIControl {
  constructor(@inject(StoreControl) private storeControl: StoreControl) {}
  getSymbols(assets = this.storeControl.getAssets()) {
    return assets.map((asset) => asset.symbol);
  }

  setSelectedSymbols(symbols: string[]) {
    this.storeControl.setParams({
      ...this.storeControl.getParams(),
      symbols,
    });
  }

  getSelectedSymbols(params = this.storeControl.getParams()) {
    return params.symbols;
  }

  readonly getMultiSelectEventListener = memoize(() => {
    return (_event: React.SyntheticEvent<Element, Event>, assets: string[]) => {
      this.setSelectedSymbols(assets);
    };
  });

}
