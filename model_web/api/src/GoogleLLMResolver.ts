import { injectable } from "inversify";
import { GoogleGenAI } from "@google/genai";
import { from, map } from "rxjs";

@injectable()
export class GoogleLLMResolver {
  private readonly LLM = new GoogleGenAI({
    apiKey: process.env.GOOGLE_LLM_API,
  });

  private static readonly PREFIX = "Omit the opening remarks, such as: Okay, I will..., liked expressions, and only respond with the main content. ";

  simple(prompt: string) {
    return from(
      this.LLM.models.generateContent({
        contents: `${GoogleLLMResolver.PREFIX} ${prompt}`,
        model: "gemini-2.5-flash",
      })
    ).pipe(map((r) => r.text));
  }

  generate(prompt: string) {
    return from(
      this.LLM.models.generateContent({
        contents: `${GoogleLLMResolver.PREFIX} ${prompt}`,
        model: "gemini-2.5-pro",
      })
    ).pipe(map((r) => r.text));
  }
}
