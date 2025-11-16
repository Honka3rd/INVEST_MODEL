import express, { Request, Response } from "express";
import cors from "cors";
import path from "path"; // 新增：路径处理
import dotenv from "dotenv"; // import dotenv
import { ControllerLookupContainer } from "./inversify.config";
import { lastValueFrom } from "rxjs";
import { AssetAllocator } from "./AssetAllocator";
import { FinnhubAssetResolver } from "./FinnhubAssetResolver";
import { SurPapiDataFetcher } from "./SurPapiDataFetcher";
import { isString } from "lodash";
import { GoogleLLMResolver } from "./GoogleLLMResolver";
import { PublicOpinionDataResolver } from "./PublicOpinionDataResolver";
import { LanguageE } from "@shared/LanguageE";
dotenv.config(); // load .env file
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // 跨域
app.use(express.json()); // 解析 JSON body
// Serve frontend build (frontend/dist). Use a relative path from api/src -> model_web/frontend/dist
app.use(express.static(path.join(__dirname, "../../app/dist")));

app.get("/assets", async (req: Request, res: Response) => {
  try {
    const resolver = ControllerLookupContainer.get(FinnhubAssetResolver);
    const assets = await lastValueFrom(resolver.resolve());
    res.json({ success: true, data: assets });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /metrics: 获取指标
app.post("/metrics", async (req: Request, res: Response) => {
  try {
    const { body } = req; // 从 body 解析
    const allocator =
      ControllerLookupContainer.get<AssetAllocator>(AssetAllocator);
    if (!allocator.isValidParams(body)) {
      return res.status(400).json({ error: "Invalid Argument" });
    }

    const allocation = await lastValueFrom(allocator.allocate(body));
    return res.json({ success: true, data: allocation });
  } catch (error) {
    console.error("Metrics error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/news/google", async (req: Request, res: Response) => {
  try {
    const search = req.query.search?.toString().trim().toLowerCase() === "true";
    const lang = LanguageE.parse(req.query.lang?.toString());
    const fetcher = ControllerLookupContainer.get(SurPapiDataFetcher);
    console.log("Received query:", req.query);
    console.log("Received language:", lang.code(), lang.isValid());
    const results = await lastValueFrom(
      fetcher.resolve(
        req.body,
        lang.isInvalid() ? LanguageE.ENGLISH : lang,
        search
      )
    );
    return res.json({ data: results, success: true });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/ask/llm", async (req: Request, res: Response) => {
  const llm = ControllerLookupContainer.get(GoogleLLMResolver);
  try {
    const prompt = req.query.prompt;
    if (isString(prompt)) {
      const results = await lastValueFrom(llm.generate(prompt));
      return res.json({ data: results, success: true });
    }
    return res
      .status(400)
      .json({ error: `Invalid param, type of q is ${typeof prompt}` });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/opinions", async (req: Request, res: Response) => {
  try {
    const opinion = ControllerLookupContainer.get(PublicOpinionDataResolver);
    const lang = LanguageE.parse(req.query.lang?.toString());
    
    const results = await lastValueFrom(
      opinion.opinions(req.body, lang.isInvalid() ? LanguageE.ENGLISH : lang)
    );
    return res.json({ data: results, success: true });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/", (req: Request, res: Response) => {
  res.sendFile(
    path.join(__dirname, "../../model_web/frontend/dist/index.html")
  );
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
