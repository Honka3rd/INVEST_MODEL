import { injectable } from "inversify";
import { from, map, switchMap } from "rxjs";
import dotenv from "dotenv";
import path from "path";

// Load Python service env located outside model_web
dotenv.config({
  path: path.resolve(__dirname, "../../../model_llm_service/.env"),
});

enum GoogleModelE {
  FLASH = "flash",
  PRO="professional"
}

@injectable()
export class GoogleLLMResolver {
  private readonly baseUrl = `http://${process.env.FLASK_HOST ?? "0.0.0.0"}:${
    process.env.FLASK_PORT ?? "8000"
  }`;

  resolve(prompt: string, model: GoogleModelE = GoogleModelE.FLASH) {
    const url = `${this.baseUrl}/${model}`;
    return from(
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
    ).pipe(
      map((r) => {
        if (!r.ok) {
          throw new Error(`Flash LLM failure ${r.status}`);
        }
        return r;
      }),
      switchMap((r) => from(r.json())),
      map((result: { response: string }) => result.response)
    );
  }

  flash(prompt: string) {
    return this.resolve(prompt, GoogleModelE.FLASH);
  }

  professional(prompt: string) {
    return this.resolve(prompt, GoogleModelE.PRO);
  }
}
