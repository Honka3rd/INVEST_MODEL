import React, { useMemo } from "react";
import { TextField } from "@mui/material";
import { WebBeanLookupContainer } from "../../inversify.config";
import { FormUIControl } from "./formUIControl";
import { useTotalAssets } from "../../observers";
import { useTranslation } from "react-i18next";

interface TotalInputProps {
  value: number;
  onChange: (value: number) => void;
}

export const TotalInput: React.FC<TotalInputProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <TextField
      label={t("portfolio.totalAssets")}
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      inputProps={{ min: 0, step: 1000 }}
      sx={{ mb: 2 }}
      size="small"
    />
  );
};

export const ControlledTotalInput: React.FC = () => {
  const formUIControl = useMemo(() => {
    return WebBeanLookupContainer.get(FormUIControl);
  }, []);
  const asset = useTotalAssets();
  const onChange = (value: number) => {
    formUIControl.setTotalAssets(value);
  };
  return <TotalInput value={asset} onChange={onChange} />;
};
