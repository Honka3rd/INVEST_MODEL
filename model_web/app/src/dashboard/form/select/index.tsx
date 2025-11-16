import { type FC } from "react";
import { AssetsUIControl } from "./assetsUIControl";
import AssetMultiSelect from "./ui";
import {
  WebBeanLookupContainer,
} from "../../../inversify.config";
import { useMount, useObservable } from "../../../hooks";
import { useSelectedSymbols, useSymbols } from "../../../observers";
import { CachedDataControlSelectors } from "../../../inversify.selector";

const AssetSelector: FC = () => {
  const assetsUIControl = WebBeanLookupContainer.get(AssetsUIControl);
  const assetDataControl = WebBeanLookupContainer.get(
    CachedDataControlSelectors.cachedAsset
  );

  const assets = useSymbols();
  const selectedAssets = useSelectedSymbols();
  const onChange = assetsUIControl.getMultiSelectEventListener();

  useObservable(assetDataControl.syncData());
  useMount(() => {
    assetDataControl.invoke();
  });
  return (
    <AssetMultiSelect
      assets={assets}
      selectedAssets={selectedAssets}
      onChange={onChange}
    />
  );
};
export default AssetSelector;
