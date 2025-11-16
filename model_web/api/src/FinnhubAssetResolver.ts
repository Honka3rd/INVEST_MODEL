import { injectable } from "inversify";
import { from, map, switchMap } from "rxjs";
import z from "zod";
@injectable()
export class FinnhubAssetResolver {
  static readonly AssetSymbolSchema = z
    .object({
      currency: z.string(),
      description: z.string(),
      displaySymbol: z.string(),
      figi: z.string().nullable(),
      isin: z.nullable(z.string()),
      mic: z.string(),
      shareClassFIGI: z.string().nullable(),
      symbol: z.string(),
      symbol2: z.string(),
      type: z.string(),
    })
    .loose();

  static readonly FinnhubAssetsSchema = z.array(
    FinnhubAssetResolver.AssetSymbolSchema
  );

  private makeFinnhubURL() {
    const apiKey = process.env.FINNHUB_API_KEY;
    return `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${apiKey}`;
  }

  resolve() {
    const url = this.makeFinnhubURL();
    console.log("Fetching Finnhub assets from URL:", url);
    return from(
      fetch(url, {
        // 加 headers 防挡
        headers: { "User-Agent": "MPT-API/1.0" },
      })
    ).pipe(
      switchMap((r) => {
        if (!r.ok) {
          throw new Error(`HTTP Finnhub API status: ${r.status}`);
        }
        return from(r.json()).pipe(
          map((json) => FinnhubAssetResolver.FinnhubAssetsSchema.parse(json))
        );
      })
    );
  }
}

export type FinnhubAsset = z.infer<
  typeof FinnhubAssetResolver.AssetSymbolSchema
>;
export type FinnhubAssets = z.infer<
  typeof FinnhubAssetResolver.FinnhubAssetsSchema
>;
