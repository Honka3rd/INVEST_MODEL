import { inject, injectable } from "inversify";
import { FinnhubAsset } from "./FinnhubAssetResolver";
import { GoogleLLMResolver } from "./GoogleLLMResolver";
import { tap, concat, map, timer, catchError, of } from "rxjs";
import { PublicOpinions } from "./types";
import { isUndefined } from "lodash";
import { DebugLogger, Logger } from "./logger";
import { LanguageE } from "@shared/LanguageE";
@injectable()
export class PublicOpinionDataResolver {
  private static readonly LOGGER: Logger = DebugLogger.getLogger(
    PublicOpinionDataResolver
  );
  private static readonly HTMLFY = `* Note: Please output plain HTML suitable for display on a website, while maintaining the quality of your answer. (This refers to document fragments, not complete HTML, such as a DIV element.)
  And do not wrap document fragments with irrelevant characters, as this will affect the rendering.`;

  private static lang = (lang: LanguageE) => {
    return `Note: The Response language should be in ${lang.name()}.`;
  };

  private static readonly NEUTRAL = (asset: FinnhubAsset, lang: LanguageE) => {
    return `
    ${PublicOpinionDataResolver.lang(lang)}

    Please help me collect and summarize the sentiment regarding [${
      asset.symbol
    }] (ticker symbol: [${
      asset.description
    }]) on X (Twitter) and Reddit (primarily focusing on r/investing, r/stocks, r/economy, and the dedicated subreddit for [${
      asset.symbol
    }]).

    I need to know:

    1. What are the trending news or discussion keywords related to $[ASSET_TICKER] on X?

    2. What are the main discussion topics and market sentiment (positive/negative/neutral) on Reddit?
    ${PublicOpinionDataResolver.HTMLFY}
    `;
  };

  private static readonly POPULAR = (asset: FinnhubAsset, lang: LanguageE) => {
    return `
    ${PublicOpinionDataResolver.lang(lang)}
    Please analyze retail investor sentiment regarding [${
      asset.symbol
    }] (ticker symbol: [${
      asset.description
    }]) on the StockTwits platform over the past 24 hours.

    Please provide:

    1. The overall sentiment indicators displayed on the platform (e.g., the percentage of "bullish" vs. "bearish").

    2. A summary of the most frequently used bullish keywords (e.g., to the moon, buy the dip) by retail investors when discussing $[ASSET_TICKER].

    3. A summary of the most frequently used bearish keywords (e.g., bubble, rug pull, overbought).
    ${PublicOpinionDataResolver.HTMLFY}
    `;
  };

  private static readonly PROFESSIONAL = (
    asset: FinnhubAsset,
    lang: LanguageE
  ) => {
    return `
    ${PublicOpinionDataResolver.lang(lang)}

    Please help me scrape and summarize the latest professional technical analysis sentiment regarding [${
      asset.symbol
    }] (code: [${
      asset.description
    }]) from the "Ideas" and "Chat" sections of the TradingView platform.

    Please note: This is for non-technical professionals and requires easy-to-understand explanations.

    I need to know:

    1. The most frequently discussed "technical analysis keywords" (e.g., RSI, MACD, Moving Average).

    2. What are the "chart patterns" commonly mentioned by analysts? (e.g., head and shoulders top, double bottom, rising wedge).

    3. What are the "key price levels" they focus on most? (e.g., support at $XX, resistance at $YY).
    ${PublicOpinionDataResolver.HTMLFY}
    
    `;
  };

  constructor(
    @inject(GoogleLLMResolver) private readonly googleLLM: GoogleLLMResolver
  ) {}

  private trim(r?: string) {
    if (isUndefined(r)) {
      return "";
    }
    return r
      .replace(/^\s*```html\s*\n?/, "") // 去除开头
      .replace(/\n?\s*```\s*$/, ""); // 去除结尾
  }

  neutral(query: FinnhubAsset, lang: LanguageE) {
    return this.googleLLM
      .generate(PublicOpinionDataResolver.NEUTRAL(query, lang))
      .pipe(map((r) => this.trim(r)));
  }

  popular(query: FinnhubAsset, lang: LanguageE) {
    return this.googleLLM
      .generate(PublicOpinionDataResolver.POPULAR(query, lang))
      .pipe(map((r) => this.trim(r)));
  }

  professional(query: FinnhubAsset, lang: LanguageE) {
    return this.googleLLM
      .generate(PublicOpinionDataResolver.PROFESSIONAL(query, lang))
      .pipe(map((r) => this.trim(r)));
  }

  opinions(query: FinnhubAsset, lang: LanguageE) {
    PublicOpinionDataResolver.LOGGER.info(
      `Fetching opinions for ${query.symbol} in ${lang.name()}`
    );
    const opinions: PublicOpinions = {
      neutral: "",
      popular: "",
      professional: "",
    };
    return concat(
      this.neutral(query, lang).pipe(
        catchError((err: Error) =>
          of().pipe(
            tap(() => PublicOpinionDataResolver.LOGGER.error(err, "Neural"))
          )
        ),
        tap((r) => {
          console.log("Neural Done", r.length);
          if (r) opinions.neutral = r;
        })
      ),
      timer(2000),
      this.popular(query, lang).pipe(
        catchError((err: Error) =>
          of().pipe(
            tap(() => PublicOpinionDataResolver.LOGGER.error(err, "Popular"))
          )
        ),
        tap((r) => {
          console.log("Popular Done", r.length);
          if (r) opinions.popular = r;
        })
      ),
      timer(2000),
      this.professional(query, lang).pipe(
        catchError((err: Error) =>
          of().pipe(
            tap(() =>
              PublicOpinionDataResolver.LOGGER.error(err, "Professional")
            )
          )
        ),
        tap((r) => {
          console.log("Professional Done", r.length);
          if (r) opinions.professional = r;
        })
      )
    ).pipe(map(() => opinions));
  }
}
