import type { FinnhubAsset } from "../api/assets"
import type { AnalyzedAssetContent } from "../store";

export type TabChange = (event: React.SyntheticEvent<Element, Event>, value: any) => void
export interface TabProps extends FinnhubAsset {
  value: number
  label: string
}

export interface DynamicTabProps extends TabProps {
    currentValue: number;
    analyzed?: AnalyzedAssetContent
}

