import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { Metrics } from "../../api/metrics";
import { useLanguage, useMetrics } from "../../observers";
import { useTranslation } from "react-i18next";

interface MetricsVizProps {
  metrics: Metrics;
}

const MetricsViz: React.FC<MetricsVizProps> = ({ metrics }) => {
  const lang = useLanguage();
  const { t } = useTranslation();

  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!metrics || !chartRef.current) return;

    // 准备饼图数据：从 weights 迭代，添加金额
    const pieData = Object.entries(metrics.weights).map(([symbol, weight]) => ({
      name: symbol,
      value: weight * 100, // 转百分比显示
      amount: metrics.amounts[symbol as keyof Metrics["amounts"]] || 0,
    }));

    // 饼图配置
    const option = {
      title: { text: t("portfolio.assetWeightDistribution"), left: "center" },
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const percent =
            typeof params.percent === "number"
              ? params.percent.toFixed(1)
              : params.percent;
          return `${params.name}: ${percent}%<br/>${t(
            "portfolio.amountRMB"
          )}: ${params.data.amount.toLocaleString()}`;
        },
      },
      series: [
        {
          name: t("portfolio.weightPercent"),
          type: "pie",
          radius: "60%", // 稍大圆形
          data: pieData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
          label: {
            show: true,
            formatter: "{b}: {d}%", // 显示符号和百分比
          },
          labelLine: { show: true },
        },
      ],
    };

    // 初始化图表
    const chart = echarts.init(chartRef.current);
    chart.setOption(option);

    // 清理
    return () => chart.dispose();
  }, [metrics, lang, t]);

  return (
    <div style={{ height: "400px", width: "50%" }}>
      <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export const ControlledMetricsViz: React.FC = () => {
  const metrics = useMetrics();
  return metrics ? (
    <MetricsViz metrics={metrics} />
  ) : (
    <div>Loading chart...</div>
  );
};
