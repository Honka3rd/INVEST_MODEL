import { injectable } from "inversify";
import { map } from "rxjs";
import { ajax } from "rxjs/ajax";
import z from "zod";
import type { ModelAPIResponse } from "./types";
import { Params } from "./params";
@injectable()
export class AssetsAPI {
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

  static readonly FinnhubAssetsSchema = z.array(AssetsAPI.AssetSymbolSchema);

  assets() {
    return ajax.getJSON<ModelAPIResponse<FinnhubAssets>>(Params.ASSETS).pipe(
      map((r) => {
        return r.data;
      }),
      map((response) => {
        return AssetsAPI.FinnhubAssetsSchema.parse(response);
      })
    );
  }
}

export type FinnhubAsset = z.infer<typeof AssetsAPI.AssetSymbolSchema>;
export type FinnhubAssets = z.infer<typeof AssetsAPI.FinnhubAssetsSchema>;
