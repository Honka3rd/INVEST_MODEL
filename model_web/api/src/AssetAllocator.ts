import { inject, injectable } from "inversify";
import { PortfolioMetricsProvider } from "./PortfolioMetricsProvider";
import { FredRFDataResolver } from "./FredRFDataResolver";
import { CalculationResult } from "./PortfolioMetricsCalculator";
import { PortfolioMetricsParams } from "./types";
import { switchMap, map } from "rxjs";

@injectable()
export class AssetAllocator {
  private static readonly DEFAULT_ITERATIO = 10000;
  constructor(
    @inject(PortfolioMetricsProvider)
    private readonly portfolioMetricsProvider: PortfolioMetricsProvider,
    @inject(FredRFDataResolver)
    private readonly fredRFDataResolver: FredRFDataResolver
  ) {}

  /**
   * MPT 资产分配优化：最大化夏普比率
   * @param result - 计算结果 { mu, sigma, corr }
   * @param rf - 无风险率 (e.g., 0.0401)
   * @param totalAssets - 总金额 (RMB, 默认 500000)
   * @param iterations - 蒙地卡罗迭代次数 (默认 10000)
   * @returns 分配结果
   */
  private optimize(
    result: CalculationResult,
    rf: number,
    totalAssets: number,
    iterations: number = 10000
  ) {
    const { mu, sigma, corr } = result;
    const n = mu.length;
    if (n === 0) throw new Error("No assets to optimize");
    const dynamicIterations = iterations || Math.min(10000 + n * 1000, 50000);
    // 协方差矩阵 cov = sigma * corr * sigma (逐元素)
    const cov: number[][] = corr.map((row, i) =>
      row.map((val, j) => sigma[i] * val * sigma[j])
    );

    // 蒙地卡罗：随机权重，选最佳夏普
    let bestWeights: number[] | null = null;
    let bestSharpe = -Infinity;

    for (let iter = 0; iter < dynamicIterations; iter++) {
      // 随机权重 (Dirichlet 近似：正数归一化)
      let randomWeights = Array.from({ length: n }, () => Math.random());
      const sum = randomWeights.reduce((a, b) => a + b, 0);
      randomWeights = randomWeights.map((w) => w / sum);

      // 组合回报 = w · mu
      const portReturn = randomWeights.reduce(
        (sum, w, i) => sum + w * mu[i],
        0
      );

      // 组合方差 = w^T · cov · w
      let portVariance = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          portVariance += randomWeights[i] * randomWeights[j] * cov[i][j];
        }
      }
      const portRisk = Math.sqrt(portVariance);

      // 夏普 = (portReturn - rf) / portRisk
      const sharpe = portRisk > 0 ? (portReturn - rf) / portRisk : 0;

      if (sharpe > bestSharpe) {
        bestSharpe = sharpe;
        bestWeights = randomWeights;
      }
    }

    if (!bestWeights) throw new Error("No valid allocation found");

    // 转金额 (四舍五入)
    const amounts = bestWeights.map((w) => Math.round(w * totalAssets));

    // 组合指标
    const portfolioReturn = bestWeights.reduce(
      (sum, w, i) => sum + w * mu[i],
      0
    );
    let portfolioVariance = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        portfolioVariance += bestWeights[i] * bestWeights[j] * cov[i][j];
      }
    }
    const portfolioRisk = Math.sqrt(portfolioVariance);

    return {
      weights: bestWeights.map((w) => Math.round(w * 10000) / 100), // 百分比，2 位小数
      amounts,
      sharpe: bestSharpe,
      portfolioReturn,
      portfolioRisk,
    };
  }

  isValidParams(params: any): params is PortfolioMetricsParams {
    const { symbols, period, interval, totalAssets } = params;
    return (
      this.portfolioMetricsProvider.isValidSymbols(symbols) &&
      this.portfolioMetricsProvider.isValidPeriod(period) &&
      this.portfolioMetricsProvider.isValidInterval(interval) &&
      Number.isInteger(totalAssets)
    );
  }

  allocate(params: PortfolioMetricsParams) {
    const { symbols, period, interval, totalAssets } = params;
    return this.portfolioMetricsProvider
      .getMetrics(symbols, period, interval)
      .pipe(
        switchMap((r) => {
          return this.fredRFDataResolver.resolve().pipe(
            map((rfMeta) => {
              return this.optimize(
                r,
                rfMeta.rf,
                totalAssets,
                AssetAllocator.DEFAULT_ITERATIO
              );
            }),
            map((result) => ({
              ...result,
              weights: symbols.reduce((acc, next, i) => {
                acc[next] = result.weights[i];
                return acc;
              }, {} as Record<string, number>),
              amounts: symbols.reduce((acc, next, i) => {
                acc[next] = result.amounts[i];
                return acc;
              }, {} as Record<string, number>),
            }))
          );
        })
      );
  }
}
