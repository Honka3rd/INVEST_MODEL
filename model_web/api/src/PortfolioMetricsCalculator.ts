import { injectable } from "inversify";

export interface CalculationResult {
  mu: number[];
  sigma: number[];
  corr: number[][];
}

@injectable()
export class PortfolioMetricsCalculator {
  calculateFromPrices(pricesArrays: number[][]): CalculationResult {
    const n = pricesArrays.length;
    if (n < 1) throw new Error("pricesArrays must have at least one asset");

    const mu: number[] = new Array(n).fill(0);
    const sigma: number[] = new Array(n).fill(0);
    const returns: number[][] = [];

    for (let i = 0; i < n; i++) {
      const prices = pricesArrays[i];
      if (prices.length < 2) {
        throw new Error(`Asset ${i} has insufficient prices: ${prices.length}`);
        // 或 fallback: mu[i] = 0; sigma[i] = 0; returns.push([]); continue;
      }

      // 計算日回報 (用 reduce 優化)
      const dailyReturns = prices.slice(1).reduce<number[]>((acc, price, j) => {
        const prev = prices[j];
        acc.push((price - prev) / prev);
        return acc;
      }, []);

      returns.push(dailyReturns);

      // mu: 平均日回報 * 252
      const meanDaily =
        dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
      mu[i] = meanDaily * 252;

      // sigma: 樣本標準差 * √252 (用 / (len - 1) 為樣本方差)
      const len = dailyReturns.length;
      const variance =
        dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanDaily, 2), 0) /
        (len - 1); // 改為樣本方差
      sigma[i] = Math.sqrt(variance) * Math.sqrt(252);
    }

    // corr: Pearson 相關矩陣
    const corr = this.calculateCorrelation(returns);

    return { mu, sigma, corr };
  }

  private calculateCorrelation(returns: number[][]): number[][] {
    const n = returns.length;
    const corr: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          corr[i][j] = 1.0;
          continue;
        }
        const ret1 = returns[i];
        const ret2 = returns[j];
        const minLen = Math.min(ret1.length, ret2.length);
        if (minLen < 2) {
          corr[i][j] = 0; // 改為 0 而非 continue (確保矩陣完整)
          corr[j][i] = 0;
          continue;
        }

        // 用 reduce 計算 mean1/mean2
        const mean1 = ret1.slice(0, minLen).reduce((a, b) => a + b, 0) / minLen;
        const mean2 = ret2.slice(0, minLen).reduce((a, b) => a + b, 0) / minLen;

        // numerator: 共變異數 (reduce)
        const numerator =
          ret1.slice(0, minLen).reduce((sum, r1, k) => {
            const r2 = ret2[k];
            return sum + (r1 - mean1) * (r2 - mean2);
          }, 0) / minLen;

        // denom1/denom2: 標準差 (reduce)
        const denom1Sq =
          ret1
            .slice(0, minLen)
            .reduce((sum, r1) => sum + Math.pow(r1 - mean1, 2), 0) / minLen;
        const denom2Sq =
          ret2
            .slice(0, minLen)
            .reduce((sum, r2) => sum + Math.pow(r2 - mean2, 2), 0) / minLen;
        const denom1 = Math.sqrt(denom1Sq);
        const denom2 = Math.sqrt(denom2Sq);

        // 防 NaN/Inf
        corr[i][j] =
          denom1 === 0 ||
          denom2 === 0 ||
          !isFinite(numerator / (denom1 * denom2))
            ? 0
            : numerator / (denom1 * denom2);
        corr[j][i] = corr[i][j]; // 對稱
      }
    }
    return corr;
  }
}
