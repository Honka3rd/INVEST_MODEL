import { inject, injectable } from "inversify";
import { catchError, from, map, of, switchMap, tap } from "rxjs";
import z from "zod";
import { GoogleLLMResolver } from "./GoogleLLMResolver";
import { FinnhubAsset } from "./FinnhubAssetResolver";
import { DebugLogger, Logger } from "./logger";
import { LanguageE } from "@shared/LanguageE";

@injectable()
export class SurPapiDataFetcher {
  private static readonly LOGGER: Logger =
    DebugLogger.getLogger(SurPapiDataFetcher);

  private static readonly SerpApiRelatedArticleSchema = z
    .object({
      title: z.string().optional(),
      link: z.url().optional(),
      source: z.string().optional(),
      date: z.string().optional(),
    })
    .loose();

  private static readonly SerpApiNewsResultSchema = z
    .object({
      position: z.number().optional(),
      title: z.string(),
      link: z.url(),
      source: z.string().optional(),
      date: z.string().optional(),
      snippet: z.string().optional(),
      thumbnail: z.url().optional(),
      related_articles: z
        .array(SurPapiDataFetcher.SerpApiRelatedArticleSchema)
        .optional(),
    })
    .loose();

  private static readonly SerpApiSearchMetadataSchema = z
    .object({
      id: z.string().optional(),
      status: z.string().optional(),
      json_endpoint: z.url().optional(),
    })
    .loose();

  private static readonly SerpApiSearchParametersSchema = z
    .object({
      engine: z.string().optional(),
      q: z.string().optional(),
      tbm: z.string().optional(),
    })
    .loose();

  public static readonly SerpApiResponseSchema = z
    .object({
      search_metadata:
        SurPapiDataFetcher.SerpApiSearchMetadataSchema.optional(),
      search_parameters:
        SurPapiDataFetcher.SerpApiSearchParametersSchema.optional(),
      organic_results: z
        .array(SurPapiDataFetcher.SerpApiNewsResultSchema)
        .optional(),
    })
    .loose();

  private makeURL(query: FinnhubAsset) {
    SurPapiDataFetcher.LOGGER.info(query);
    return `https://serpapi.com/search.json?q=${encodeURIComponent(
      `${query.symbol} OR "${query.description}"`
    )}&api_key=${process.env.SUR_PAPI_API_KEY}`;
  }

  private static readonly TABLE_HTML = `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; text-align: left;">
            <thead style="background-color: #f2f2f2;">
                <tr>
                <th>Field</th>
                <th>Value</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                <td><strong>sentiment</strong></td>
                <td>bullish | bearish | neutral</td>
                </tr>
                <tr>
                <td><strong>themes</strong></td>
                <td>
                    <ul style="margin: 0; padding-left: 20px;">
                    <li>tech</li>
                    <li>ETF flows</li>
                    <li>...</li>
                    </ul>
                </td>
                </tr>
                <tr>
                <td><strong>key_factors</strong></td>
                <td>
                    <ul style="margin: 0; padding-left: 20px;">
                    <li>rising yields</li>
                    <li>rotation to value</li>
                    </ul>
                </td>
                </tr>
            </tbody>
        </table>`;

  private static promptFactory(
    asset: FinnhubAsset,
    lang: LanguageE,
    result?: SerpApiResponse
  ) {
    SurPapiDataFetcher.LOGGER.info("Search results:", result?.organic_results);
    const pairs = result?.organic_results?.map((r) => ({
      title: r.title,
      site: r.link,
      box: r.answer_box,
    }));
    return `
      You are a macro and market analyst.
      The Response language should be in ${lang.name()}.
      Based on the following [news summary and corresponding URL], analyze the market's overall attitude towards "${asset.symbol} (${asset.description})" and its potential impact:

      (If the [news summary and corresponding URL JSON body] is null, please search and analyze according to the following principles:)

      - Summarize the overall sentiment (positive / negative / neutral)

      - The structured JSON may not up-to-date, if so, please analyze based on the latest news

      - Identify the core themes mentioned (e.g., tech stocks, interest rates, fund flows, regulation)

      - Briefly describe which factors might drive or suppress its price

      - Finally, provide a brief summary viewpoint.

        The following is a summary of the latest news and its corresponding URL (JSON structure: { title: summary, site: hyperlink, box: asset stats }):
        *JSON start*
        *JSON body: ${pairs ? JSON.stringify(pairs) : "null"}*
        *JSON end*
        Analyze the abstracts and corresponding hyperlinks, prioritizing more recent dates.

        Then output the results using an HTML table in the following format:
        ${SurPapiDataFetcher.TABLE_HTML}
        To summarize in natural language
    `;
  }

  search(query: FinnhubAsset) {
    const url = this.makeURL(query);
    SurPapiDataFetcher.LOGGER.info("Fetch URL:", url);
    return from(
      fetch(url, {
        // 加 headers 防挡
        headers: { "User-Agent": "MPT-API/1.0" },
      })
    ).pipe(
      map((r) => {
        if (!r.ok) {
          throw new Error(`Search failure ${r.status}`);
        }
        return r;
      }),
      switchMap((r) =>
        from(r.json()).pipe(
          map((result) =>
            SurPapiDataFetcher.SerpApiResponseSchema.parse(result)
          )
        )
      )
    );
  }

  analyze(asset: FinnhubAsset, lang: LanguageE, result?: SerpApiResponse) {
    SurPapiDataFetcher.LOGGER.info("Analyzing Results in:", lang.name());
    return of(SurPapiDataFetcher.promptFactory(asset, lang, result)).pipe(
      switchMap((prompt) => this.googleLLM.professional(prompt))
    );
  }

  constructor(
    @inject(GoogleLLMResolver) private readonly googleLLM: GoogleLLMResolver
  ) {}

  resolve(query: FinnhubAsset, lang: LanguageE, search?: boolean) {
    SurPapiDataFetcher.LOGGER.info("Fetching Results for:", query.symbol);
    const url = this.makeURL(query);
    SurPapiDataFetcher.LOGGER.info("Fetch URL:", url);
    if (search) {
      return this.search(query).pipe(
        switchMap((r) => this.analyze(query, lang, r)),
        catchError((err) =>
          of(err).pipe(
            tap((err: Error) => SurPapiDataFetcher.LOGGER.error(err)),
            switchMap(() => this.analyze(query, lang))
          )
        )
      );
    }
    return this.analyze(query, lang);
  }
}

export type SerpApiResponse = z.infer<
  typeof SurPapiDataFetcher.SerpApiResponseSchema
>;
