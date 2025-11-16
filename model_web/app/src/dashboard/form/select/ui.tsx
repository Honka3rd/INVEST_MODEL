import { Autocomplete, TextField, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { AssetMultiSelectProps } from "./types";
const AssetMultiSelect: React.FC<AssetMultiSelectProps> = ({
  assets,
  selectedAssets,
  onChange,
  label,
}) => {
  const { t } = useTranslation();
  const effectiveLabel = label || t("portfolio.selectAssets");
  const placeholder = t("portfolio.selectAssetsPlaceholder", "Search assets (e.g., QQQ, SPY)");
  return (
    <Autocomplete
      multiple
      options={assets}
      getOptionLabel={(option) => option} // Display the name
      value={selectedAssets} // Controlled component
      onChange={onChange}
      renderInput={(params) => (
        <TextField
          {...params}
          label={effectiveLabel}
          placeholder={placeholder}
          variant="outlined"
          fullWidth
          sx={{ mb: 2 }}
        />
      )}
      renderTags={(value: string[], getTagProps) =>
        value.map((option, index) => {
          const {key, ...props} = getTagProps({ index })
          return (
            <Chip
              variant="outlined"
              label={option}
              key={key}
              {...props}
              sx={{ m: 0.5 }}
            />
          );
        })
      }
      filterOptions={(options, { inputValue }) =>
        options.filter((option) =>
          option.toLowerCase().includes(inputValue.toLowerCase())
        )
      }
      sx={{
        minWidth: "300px",
        "& .MuiAutocomplete-inputRoot": {
          padding: "4px 8px",
        },
      }}
    />
  );
};

export default AssetMultiSelect;
