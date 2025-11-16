export interface AssetMultiSelectProps {
  assets: string[]; // Full list of available assets
  selectedAssets: string[]; // Currently selected assets
  onChange: (_event: React.SyntheticEvent<Element, Event>, assets: string[]) => void ,
  label?: string; // Optional label for the input
}
