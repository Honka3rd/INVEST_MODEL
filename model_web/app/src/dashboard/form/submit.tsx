import { Button } from "@mui/material";
import type { FC } from "react";
import { useLoading } from "../../observers";
import { useTranslation } from "react-i18next";

export const Submit: FC<{ disabled: boolean }> = ({ disabled }) => {
  const { t } = useTranslation();
  return (
    <Button type="submit" disabled={disabled}>
      {t("portfolio.submit")}
    </Button>
  );
};

export const ControlledSubmit: FC = () => {
  const loading = useLoading();
  return <Submit disabled={loading} />;
};
