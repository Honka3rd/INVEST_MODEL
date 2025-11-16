import { injectable } from "inversify";
import { from, map, Observable, switchMap } from "rxjs";
import z from "zod";
import { RfMeta } from "./types";

@injectable()
export class FredRFDataResolver {
  private static readonly FredResponseSchema = z
    .object({
      realtime_start: z.iso.date().optional(), // ISO 日期字符串
      realtime_end: z.iso.date().optional(),
      observation_start: z.iso.date().optional(), // 历史开始日期
      observation_end: z.iso.date().optional(), // 历史结束日期
      units: z.string().optional(), // e.g., "lin"
      output_type: z.number().int().min(1).optional(), // 1 for JSON
      file_type: z.string().optional(), // e.g., "json"
      order_by: z.string().optional(), // e.g., "observation_date"
      sort_order: z.string().optional(), // e.g., "desc"
      count: z.number().int().min(0).optional(), // 总记录数
      offset: z.number().int().min(0).optional(), // 偏移
      limit: z.number().int().min(1).optional(), // 限制
      observations: z
        .array(
          z.object({
            realtime_start: z.iso.date().optional(),
            realtime_end: z.iso.date().optional(),
            date: z.iso.date(), // 观察日期，必填
            value: z.union([z.coerce.number(), z.literal(".")]).optional(), // "4.01" 或 "." (null)
          })
        )
        .min(0)
        .default([]), // 数组可选，非空验证在调用时
    })
    .loose();

  private makeFredURL() {
    const apiKey = process.env.FRED_API_KEY;
    if (!apiKey) throw new Error("Missing FRED_API_KEY");
    const base = "https://api.stlouisfed.org/fred/series/observations";
    const qp = new URLSearchParams({
      series_id: "DGS3MO",
      api_key: apiKey,
      file_type: "json",
      order_by: "observation_date",
      sort_order: "desc",
      limit: "5", // 多拿幾筆，遇到 "." 才有備用
    });
    return `${base}?${qp.toString()}`;
  }

  resolve(): Observable<RfMeta> {
    const url = this.makeFredURL();
    return from(
      fetch(url, {
        // 加 headers 防挡
        headers: { "User-Agent": "MPT-API/1.0" },
      })
    ).pipe(
      switchMap((r) => {
        if (!r.ok) {
          throw new Error(`HTTP Fred API status: ${r.status}`);
        }
        return from(r.json()).pipe(
          map((json) => FredRFDataResolver.FredResponseSchema.parse(json)),
          map((validated) => {
            const valid = validated.observations.find((o) => o.value !== ".");
            if (!valid)
              throw new Error("No valid numeric observation from FRED");
            const annualYield = valid.value as number; // 例如 5.36 表示 5.36%
            const rfAnnual = annualYield / 100;
            return {
              rf: rfAnnual,
              value: `${annualYield}%` as const,
              date: valid.date,
            } satisfies RfMeta;
          })
        );
      })
    );
  }
}
