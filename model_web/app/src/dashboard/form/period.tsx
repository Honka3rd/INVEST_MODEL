import React, { useMemo, type FC } from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { WebBeanLookupContainer } from "../../inversify.config";
import { FormUIControl } from "./formUIControl";
import type { Period } from "../../api/metrics";
import { usePeriod } from "../../observers";
import { useTranslation } from "react-i18next";

export interface PeriodInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const PeriodInput: React.FC<PeriodInputProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  return (
    <FormControl sx={{ minWidth: 150, mb: 2 }} size="small">
      <InputLabel>{t("portfolio.period")}</InputLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        label={t("portfolio.period")}
      >
        <MenuItem value="1y">{t("portfolio.oneYear")}</MenuItem>
        <MenuItem value="6mo">{t("portfolio.sixMonths")}</MenuItem>
        <MenuItem value="1mo">{t("portfolio.oneMonth")}</MenuItem>
      </Select>
    </FormControl>
  );
};

export const ControlledPeriodInput: FC = () => {
  const formUIControl = useMemo(() => {
    return WebBeanLookupContainer.get(FormUIControl);
  }, []);
  const period = usePeriod();
  const onChange = (value: string) => {
    formUIControl.setPeriod(value as Period);
  };
  return <PeriodInput value={period} onChange={onChange} />;
};
