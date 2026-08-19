var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var aiClient = null;
function getGenAI() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new import_genai.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
async function generateGeminiContentWithFallback(ai, prompt, temperature = 0.2) {
  const candidateModels = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-2.5-flash"];
  let lastError = null;
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature,
          responseMimeType: "application/json"
        }
      });
      const text = response.text;
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`Gemini model ${model} unavailable (${errMsg.slice(0, 80)}...), trying fallback candidate...`);
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw lastError || new Error("All Gemini candidate models failed to respond");
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      model: "gemini-3.7-flash"
    });
  });
  app.post("/api/gemini/synthesis", async (req, res) => {
    const { ticker } = req.body;
    if (!ticker || !ticker.symbol) {
      res.status(400).json({ error: "Ticker is required" });
      return;
    }
    const ai = getGenAI();
    if (!ai) {
      res.json({
        fallback: true,
        reason: "No GEMINI_API_KEY configured on server; using institutional archive."
      });
      return;
    }
    const prompt = `You are a Lead Quantitative Research Analyst and Institutional Equity Strategist.
Generate a rigorous qualitative and quantitative investment memo for ticker "${ticker.symbol}" (${ticker.name}), currently trading at ${ticker.currency} ${ticker.price}. Sector: ${ticker.sector}.

Return a STRICT valid JSON object with this exact JSON structure:
{
  "executiveSummary": "2-3 institutional sentences summarizing market positioning, core margin drivers, and competitive moat.",
  "eli5Summary": "2 simple beginner-friendly sentences explaining why people buy or avoid this company.",
  "bullishDrivers": [
    {
      "title": "Short title",
      "impactScore": 8.5,
      "horizon": "Immediate",
      "explanation": "Quantitative and institutional explanation",
      "eli5Explanation": "Simple plain-English analogy"
    }
  ],
  "bearishRisks": [
    {
      "title": "Short title",
      "impactScore": 7.0,
      "horizon": "Immediate",
      "explanation": "Quantitative downside or valuation headwind",
      "eli5Explanation": "Simple plain-English risk"
    }
  ],
  "keyCatalysts": [
    {
      "event": "Specific catalyst event",
      "timeframe": "e.g. Next 30 Days",
      "expectedImpact": "High",
      "bias": "Bullish",
      "detail": "Actionable detail"
    }
  ],
  "llmSuggestedDrift": 0.18,
  "llmSuggestedVol": 0.35,
  "confidenceScore": 88
}
Include at least 3 Bullish Drivers, 3 Bearish Risks, and 3 Key Catalysts. Only output raw valid JSON, no markdown code blocks if possible.`;
    try {
      const text = await generateGeminiContentWithFallback(ai, prompt, 0.2);
      const parsed = JSON.parse(text);
      res.json({
        success: true,
        data: {
          ticker: ticker.symbol,
          lastUpdated: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          executiveSummary: parsed.executiveSummary || `${ticker.name} displays fundamental sector strength with active risk balancing.`,
          eli5Summary: parsed.eli5Summary || `${ticker.name} is a leading player in ${ticker.sector}.`,
          bullishDrivers: Array.isArray(parsed.bullishDrivers) ? parsed.bullishDrivers : [],
          bearishRisks: Array.isArray(parsed.bearishRisks) ? parsed.bearishRisks : [],
          keyCatalysts: Array.isArray(parsed.keyCatalysts) ? parsed.keyCatalysts : [],
          llmSuggestedDrift: typeof parsed.llmSuggestedDrift === "number" ? parsed.llmSuggestedDrift : ticker.drift,
          llmSuggestedVol: typeof parsed.llmSuggestedVol === "number" ? parsed.llmSuggestedVol : ticker.volatility,
          confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 88,
          source: "gemini"
        }
      });
    } catch (err) {
      console.info("Gemini synthesis service gracefully switching to institutional model:", err?.message || err);
      res.json({
        fallback: true,
        error: err?.message || "Gemini processing fallback active"
      });
    }
  });
  app.post("/api/gemini/scenario", async (req, res) => {
    const { scenarioTitle, scenarioDescription, ticker } = req.body;
    if (!scenarioTitle || !ticker) {
      res.status(400).json({ error: "Scenario and ticker required" });
      return;
    }
    const ai = getGenAI();
    if (!ai) {
      res.json({
        fallback: true,
        reason: "No GEMINI_API_KEY configured on server; using local heuristic model."
      });
      return;
    }
    const prompt = `You are a Lead Derivatives Risk Officer & Quantitative Portfolio Manager.
Analyze how the company/performance shock: "${scenarioTitle}" (${scenarioDescription}) will specifically impact the equity "${ticker.symbol}" (${ticker.name}, Price: ${ticker.currency} ${ticker.price}, Beta: ${ticker.beta}, Sector: ${ticker.sector}).

Specifically assess:
- If the company performs better than expected (earnings beat/guidance hike), quantify the positive drift expansion and volatility compression.
- If the company just dropped X points / suffered a sudden selloff, quantify the downward drift drag and implied volatility spike.
- Any major product breakthrough or regulatory/customer risk.

Calculate the estimated shifts in annualized Expected Drift (in decimal, e.g. +0.18 for +18%, -0.16 for -16%) and Annualized Volatility (e.g. +0.20 for +20% vol expansion, -0.04 for compression).

Return a strict JSON object:
{
  "driftShift": 0.16,
  "volShift": -0.04,
  "reasoning": "2 sentences explaining quantitative transmission to DCF multiples, cash flows, and terminal valuation.",
  "eli5Reasoning": "1 simple plain-English sentence explaining the effect for everyday investors.",
  "historicalPrecedent": "A specific past corporate or market episode, e.g., 'NVDA Q1 2023 Guidance Surge' or '2022 Tech De-grossing Selloff'"
}
Only output raw valid JSON.`;
    try {
      const text = await generateGeminiContentWithFallback(ai, prompt, 0.1);
      const parsed = JSON.parse(text);
      res.json({
        success: true,
        data: {
          driftShift: typeof parsed.driftShift === "number" ? parsed.driftShift : 0.05,
          volShift: typeof parsed.volShift === "number" ? parsed.volShift : 0.05,
          reasoning: parsed.reasoning || "Macro factor adjustments transmitted via beta-weighted sensitivity.",
          eli5Reasoning: parsed.eli5Reasoning || "This event shifts the risk and reward balance for this stock.",
          historicalPrecedent: parsed.historicalPrecedent || "Historical volatility regime shift"
        }
      });
    } catch (err) {
      console.info("Gemini scenario service gracefully switching to quantitative shock engine:", err?.message || err);
      res.json({
        fallback: true,
        error: err?.message || "Gemini scenario fallback active"
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`QuantPilot server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
