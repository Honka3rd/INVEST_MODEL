import React, { type FC } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMetrics } from "../observers";

interface PortfolioMetricsProps {
  metrics: {
    sharpe: number;
    portfolioReturn?: number | null | undefined;
    portfolioRisk?: number | null | undefined;
  };
}

export const PortfolioMetrics: React.FC<PortfolioMetricsProps> = ({
  metrics,
}) => {
  const { t } = useTranslation();
  const { sharpe, portfolioReturn, portfolioRisk } = metrics;

  // 格式化函数
  const formatValue = (
    val: number | null | undefined,
    type: "percent" | "number"
  ): string => {
    if (val === null || val === undefined) return "N/A";
    if (type === "percent") return `${(val * 100).toFixed(1)}%`;
    return val.toFixed(2);
  };

  const getColor = (
    val: number | null | undefined,
    type: "sharpe" | "return" | "risk"
  ): "green" | "red" => {
    if (val === null || val === undefined) return "red";
    switch (type) {
      case "sharpe":
        return val > 1 ? "green" : "red";
      case "return":
        return val > 0.05 ? "green" : "red";
      case "risk":
        return val < 0.15 ? "green" : "red";
      default:
        return "red";
    }
  };

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        border: 1,
        borderColor: "grey.300",
        borderRadius: 1,
        bgcolor: "grey.50",
      }}
    >
      <Typography variant="h6" gutterBottom>
        {t("portfolio.performanceSummaryTitle")}
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("portfolio.metric")}</TableCell>
              <TableCell>{t("portfolio.value")}</TableCell>
              <TableCell>{t("portfolio.explanation")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Sharpe Row */}
            <TableRow>
              <TableCell>{t("portfolio.sharpeRatio")}</TableCell>
              <TableCell sx={{ color: getColor(sharpe, "sharpe") }}>
                {formatValue(sharpe, "number")}
              </TableCell>
              <TableCell>
                {t("portfolio.sharpeDescription", {
                  defaultValue: "Risk-adjusted return (> 1 is considered strong)"
                })}
              </TableCell>
            </TableRow>

            {/* Return Row */}
            <TableRow>
              <TableCell>{t("portfolio.expectedAnnualReturn")}</TableCell>
              <TableCell sx={{ color: getColor(portfolioReturn, "return") }}>
                {formatValue(portfolioReturn, "percent")}
              </TableCell>
              <TableCell>
                {t("portfolio.expectedAnnualReturnDescription", {
                  defaultValue: "Annualized expectation based on historical data"
                })}
              </TableCell>
            </TableRow>

            {/* Risk Row */}
            <TableRow>
              <TableCell>{t("portfolio.annualizedRisk")}</TableCell>
              <TableCell sx={{ color: getColor(portfolioRisk, "risk") }}>
                {formatValue(portfolioRisk, "percent")}
              </TableCell>
              <TableCell>
                {t("portfolio.annualizedRiskDescription", {
                  defaultValue: "Volatility standard deviation (lower is more stable)"
                })}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="body2" sx={{ mt: 1, fontWeight: "bold" }}>
        {t("portfolio.overallEvaluation", {
          sharpe: formatValue(sharpe, "number"),
          defaultValue: "Overall: Sharpe {{sharpe}} indicates an efficient portfolio."
        })}
      </Typography>
    </Box>
  );
};

export const ControlledLegend: FC = () => {
  const metrics = useMetrics();
  return <PortfolioMetrics metrics={metrics} />;
};
