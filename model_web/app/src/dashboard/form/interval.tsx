import React, { useMemo, type FC } from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { WebBeanLookupContainer } from "../../inversify.config";
import { FormUIControl } from "./formUIControl";
import type { Interval } from "../../api/metrics";
import { useInterval } from "../../observers";
import { useTranslation } from "react-i18next";

interface IntervalInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
}

export const IntervalInput: React.FC<IntervalInputProps> = ({
  value,
  onChange,
  onBlur,
}) => {
  const { t } = useTranslation();
  return (
    <FormControl sx={{ minWidth: 150, mb: 2 }} size="small">
      <InputLabel>{t("portfolio.interval")}</InputLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as string)}
        onBlur={(e) => onBlur?.(e.target.value as string)}
        label={t("portfolio.interval")}
      >
        <MenuItem value="1d">{t("portfolio.daily")}</MenuItem>
        <MenuItem value="1wk">{t("portfolio.weekly")}</MenuItem>
        <MenuItem value="1mo">{t("portfolio.monthly")}</MenuItem>
      </Select>
    </FormControl>
  );
};

export const ControlledIntervalInput: FC = () => {
  const formUIControl = useMemo(() => {
    return WebBeanLookupContainer.get(FormUIControl);
  }, []);
  const interval = useInterval();
  const onChange = (value: string) => {
    formUIControl.setInterval(value as Interval);
  };
  return <IntervalInput value={interval} onChange={onChange} />;
};
