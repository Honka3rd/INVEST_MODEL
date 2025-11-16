import { injectable } from "inversify";
import { ajax } from "rxjs/ajax";
import type { FinnhubAsset } from "./assets";
import { Params } from "./params";
import type { ModelAPIResponse } from "./types";
import z from "zod";
import { map } from "rxjs";
import type { LanguageE } from "@shared/LanguageE";

export type PublicOpinions = {
  neutral: string;
  popular: string;
  professional: string;
};

@injectable()
export class OpinionsAPI {
  static readonly PublicOpinionsSchema = z.object({
    neutral: z.string(),
    popular: z.string(),
    professional: z.string(),
  });

  opinions(body: FinnhubAsset, lang: LanguageE) {
    return ajax
      .post<ModelAPIResponse<PublicOpinions>>(`${Params.OPINIONS}?lang=${lang.code()}`, body)
      .pipe(
        map((r) => OpinionsAPI.PublicOpinionsSchema.parse(r.response.data))
      );
  }
}
