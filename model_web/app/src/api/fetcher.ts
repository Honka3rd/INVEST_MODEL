import { injectable } from "inversify";
import { ajax } from "rxjs/ajax";
import z from "zod";
import { Params } from "./params";
import { map } from "rxjs";
import type { FinnhubAsset } from "./assets";
import type { ModelAPIResponse } from "./types";
import type { LanguageE } from "@shared/LanguageE";

@injectable()
export class SurAssetFetcher {
  search(body: FinnhubAsset, language: LanguageE, search?: boolean) {
    const params = new URLSearchParams({
      lang: language.code(),
      search: Boolean(search).toString(),
    })
    return ajax
      .post<ModelAPIResponse<string>>(
        `${Params.SUR_PAPI}?${params.toString()}`,
        body
      )
      .pipe(map((r) => z.string().parse(r.response.data)));
  }
}
