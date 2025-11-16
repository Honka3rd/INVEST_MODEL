import { FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import { LanguageE } from "@shared/LanguageE";
import { StoreControl } from "../../store";
import { useMemo, type FC } from "react";
import { useTranslation } from "react-i18next";
import { WebBeanLookupContainer } from "../../inversify.config";

export const LanguageSelect: FC = () => {
  const { i18n, t } = useTranslation();
  const store = WebBeanLookupContainer.get(StoreControl);

  const handleChange = (event: SelectChangeEvent) => {
    const lng = event.target.value;
    i18n.changeLanguage(lng);
    store.setLanguage(LanguageE.parse(lng));
    store.resetAllAnalyzedContents();
  };

  // Ensure current language is one of our codes; otherwise fallback to EN
  const current = useMemo(() => LanguageE.parse(i18n.language), [i18n.language]);

  return (
    <div
      style={{
        marginTop: "0.5rem",
        display: "flex",
        justifyContent: "flex-start",
      }}
    >
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel id="language-select-label">
          {t("portfolio.language", "Language")}
        </InputLabel>
        <Select
          labelId="language-select-label"
          id="language-select"
          value={current.code()}
          label={t("portfolio.language", "Language")}
          onChange={handleChange}
        >
          <MenuItem value={LanguageE.ENGLISH.code()}>English</MenuItem>
          <MenuItem value={LanguageE.JAPANESE.code()}>日本語</MenuItem>
          <MenuItem value={LanguageE.CHINESE_TRADITIONAL.code()}>
            繁體中文
          </MenuItem>
        </Select>
      </FormControl>
    </div>
  );
};