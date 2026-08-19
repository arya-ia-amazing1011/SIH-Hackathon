import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Robust helper to call Gemini with automatic model fallback across supported current models
 */
async function generateGeminiContentWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  temperature: number = 0.2
): Promise<string> {
  const candidateModels = [
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.1-pro-preview',
  ];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      // Log informative warning without polluting logs
      console.warn(`Gemini model ${model} status notice (${errMsg.slice(0, 70)}...), attempting next model...`);
      await new Promise(r => setTimeout(r, 150));
    }
  }

  throw lastError || new Error('All Gemini candidate models currently unavailable');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-3.7-flash',
    });
  });

  // 1. Qualitative Investment Synthesis Endpoint
  app.post('/api/gemini/synthesis', async (req, res) => {
    const { ticker } = req.body;
    if (!ticker || !ticker.symbol) {
      res.status(400).json({ error: 'Ticker is required' });
      return;
    }

    const ai = getGenAI();
    if (!ai) {
      // Return flag indicating fallback should be used seamlessly
      res.json({
        fallback: true,
        reason: 'No GEMINI_API_KEY configured on server; using institutional archive.',
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
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          executiveSummary: parsed.executiveSummary || `${ticker.name} displays fundamental sector strength with active risk balancing.`,
          eli5Summary: parsed.eli5Summary || `${ticker.name} is a leading player in ${ticker.sector}.`,
          bullishDrivers: Array.isArray(parsed.bullishDrivers) ? parsed.bullishDrivers : [],
          bearishRisks: Array.isArray(parsed.bearishRisks) ? parsed.bearishRisks : [],
          keyCatalysts: Array.isArray(parsed.keyCatalysts) ? parsed.keyCatalysts : [],
          llmSuggestedDrift: typeof parsed.llmSuggestedDrift === 'number' ? parsed.llmSuggestedDrift : ticker.drift,
          llmSuggestedVol: typeof parsed.llmSuggestedVol === 'number' ? parsed.llmSuggestedVol : ticker.volatility,
          confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 88,
          source: 'gemini',
        },
      });
    } catch (err: any) {
      console.info('Gemini synthesis service gracefully switching to institutional model:', err?.message || err);
      res.json({
        fallback: true,
        error: err?.message || 'Gemini processing fallback active',
      });
    }
  });

  // 2. Macro Scenario Impact Evaluation Endpoint
  app.post('/api/gemini/scenario', async (req, res) => {
    const { scenarioTitle, scenarioDescription, ticker } = req.body;
    if (!scenarioTitle || !ticker) {
      res.status(400).json({ error: 'Scenario and ticker required' });
      return;
    }

    const ai = getGenAI();
    if (!ai) {
      res.json({
        fallback: true,
        reason: 'No GEMINI_API_KEY configured on server; using local heuristic model.',
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
          driftShift: typeof parsed.driftShift === 'number' ? parsed.driftShift : 0.05,
          volShift: typeof parsed.volShift === 'number' ? parsed.volShift : 0.05,
          reasoning: parsed.reasoning || 'Macro factor adjustments transmitted via beta-weighted sensitivity.',
          eli5Reasoning: parsed.eli5Reasoning || 'This event shifts the risk and reward balance for this stock.',
          historicalPrecedent: parsed.historicalPrecedent || 'Historical volatility regime shift',
        },
      });
    } catch (err: any) {
      console.info('Gemini scenario service gracefully switching to quantitative shock engine:', err?.message || err);
      res.json({
        fallback: true,
        error: err?.message || 'Gemini scenario fallback active',
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QuantPilot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
