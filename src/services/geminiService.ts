import { StockTicker, QualitativeSynthesis, QualitativeDriver, CatalystItem } from '../types';
import { MOCK_QUALITATIVE_ARCHIVE } from '../data/mockTickers';

export async function checkServerStatus(): Promise<{ hasApiKey: boolean }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return { hasApiKey: false };
    const data = await res.json();
    return { hasApiKey: Boolean(data.hasApiKey) };
  } catch {
    return { hasApiKey: false };
  }
}

/**
 * Fetch Institutional-grade Qualitative Synthesis from server Gemini API or fallback archive
 */
export async function fetchQualitativeSynthesis(
  ticker: StockTicker
): Promise<QualitativeSynthesis> {
  try {
    const res = await fetch('/api/gemini/synthesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker }),
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        return result.data;
      }
    }
  } catch (err) {
    console.warn('Backend Gemini API not reachable, using local fallback:', err);
  }

  // Curated archive fallback
  if (MOCK_QUALITATIVE_ARCHIVE[ticker.symbol]) {
    await new Promise(r => setTimeout(r, 200));
    return {
      ...MOCK_QUALITATIVE_ARCHIVE[ticker.symbol],
      source: 'institutional_archive',
    };
  }

  return generateHeuristicSynthesis(ticker);
}

/**
 * Evaluate a Macro Scenario shock on a ticker's Drift and Volatility parameters
 */
export async function evaluateMacroScenarioImpact(
  scenarioTitle: string,
  scenarioDescription: string,
  ticker: StockTicker
): Promise<{
  driftShift: number; // e.g. +0.08 (+8%)
  volShift: number; // e.g. +0.12 (+12%)
  reasoning: string;
  eli5Reasoning: string;
  historicalPrecedent: string;
}> {
  try {
    const res = await fetch('/api/gemini/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioTitle, scenarioDescription, ticker }),
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        return result.data;
      }
    }
  } catch (err) {
    console.warn('Backend Gemini API scenario endpoint not reachable, using local model:', err);
  }

  return computeHeuristicScenarioShift(scenarioTitle, scenarioDescription, ticker);
}

function computeHeuristicScenarioShift(title: string, desc: string, ticker: StockTicker) {
  const combined = (title + ' ' + desc).toLowerCase();
  let driftShift = 0;
  let volShift = 0;
  let reasoning = '';
  let eli5Reasoning = '';
  let historicalPrecedent = 'Market Catalyst Regime Shift';

  // Check for point drop mentions (e.g. "dropped 20 points", "-15%", "dropped 30")
  const pointMatch = combined.match(/drop(?:ped)?\s*(\d+(?:\.\d+)?)\s*(?:point|pt|%|\$)/i) || combined.match(/-(\d+(?:\.\d+)?)\s*(?:point|pt|%|\$)/i);
  const droppedAmount = pointMatch ? parseFloat(pointMatch[1]) : 0;

  if (combined.includes('better than expected') || combined.includes('beat') || combined.includes('earnings') || combined.includes('guidance hike')) {
    driftShift = 0.18 * Math.max(0.9, ticker.beta * 0.85);
    volShift = -0.04;
    reasoning = `Blowout operational results and forward revenue guidance upgrades drive immediate DCF multiple expansion, lowering perceived downside tail risk for ${ticker.symbol}.`;
    eli5Reasoning = `The company crushed earnings targets and raised future forecasts, boosting investor optimism and lifting expected returns.`;
    historicalPrecedent = 'NVDA Q1 2023 Blockbuster AI Guidance / GOOGL Cloud Margin Inflection';
  } else if (droppedAmount > 0 || combined.includes('drop') || combined.includes('selloff') || combined.includes('drawdown') || combined.includes('plunge')) {
    // Proportional to dropped points or default 15% shock
    const impactFactor = droppedAmount > 0 ? Math.min(0.40, droppedAmount / (ticker.price > 1000 ? 500 : ticker.price > 100 ? 100 : 25)) : 0.16;
    driftShift = -1 * Math.max(0.10, impactFactor * 1.1);
    volShift = Math.min(0.35, 0.15 + impactFactor * 0.6);
    reasoning = `Sudden sharp liquidation (${droppedAmount > 0 ? `${droppedAmount} pt / %` : 'sudden flash drop'}) triggers forced stop-loss runs and volatility expansion, increasing short-term drawdown probability for ${ticker.symbol}.`;
    eli5Reasoning = `The sudden price drop shakes investor confidence and spikes market volatility, increasing the risk of wider price swings.`;
    historicalPrecedent = 'Post-Guidance Multiple Contraction / Flash Liquidity Drawdown';
  } else if (combined.includes('breakthrough') || combined.includes('product') || combined.includes('supercycle') || combined.includes('adoption')) {
    driftShift = 0.22 * Math.max(0.9, ticker.beta * 0.8);
    volShift = 0.05;
    reasoning = `Groundbreaking product platform launch expands total addressable market (TAM) and long-term terminal growth rate ($g$) in cash-flow projections.`;
    eli5Reasoning = `A major technological breakthrough attracts massive customer demand, creating long-term upside momentum.`;
    historicalPrecedent = 'ChatGPT Enterprise Launch / Blackwell Architecture Unveiling';
  } else if (combined.includes('customer') || combined.includes('order cut') || combined.includes('loss') || combined.includes('in-house')) {
    driftShift = -0.13 * Math.max(0.85, ticker.beta);
    volShift = 0.15;
    reasoning = `Loss of major customer volume reduces operating leverage, pressuring gross margins and increasing near-term earnings variability.`;
    eli5Reasoning = `When a major buyer cuts back on orders, sales drop and the stock becomes more volatile until new buyers fill the gap.`;
    historicalPrecedent = 'Hyperscaler Custom Silicon In-Housing Announcements';
  } else if (combined.includes('antitrust') || combined.includes('regulatory') || combined.includes('fine') || combined.includes('investigation')) {
    driftShift = -0.09;
    volShift = 0.11;
    reasoning = `Regulatory remedies and potential revenue share distribution caps inject headline risk and compress terminal P/E multiples.`;
    eli5Reasoning = `Government fines and antitrust lawsuits create legal overhang and limit certain profitable business deals.`;
    historicalPrecedent = 'DOJ Tech Antitrust Remedy Hearings & EU DMA Sanctions';
  } else {
    driftShift = Math.sin(title.length) * 0.08;
    volShift = Math.abs(Math.cos(title.length) * 0.10);
    reasoning = `Custom catalyst scenario modifies risk expectations and term structure volatility for ${ticker.symbol}.`;
    eli5Reasoning = `This company-specific event shifts both volatility and return expectations.`;
    historicalPrecedent = 'Company Event-Driven Catalyst Vector';
  }

  return {
    driftShift: Number(driftShift.toFixed(3)),
    volShift: Number(volShift.toFixed(3)),
    reasoning,
    eli5Reasoning,
    historicalPrecedent,
  };
}

function generateHeuristicSynthesis(ticker: StockTicker): QualitativeSynthesis {
  const bullish: QualitativeDriver[] = [
    {
      title: `${ticker.symbol} Core Operational Margin Expansion`,
      impactScore: 8.7,
      horizon: 'Immediate',
      explanation: `Consistent market share gain in ${ticker.sector} coupled with strong pricing power.`,
      eli5Explanation: `The company makes high-demand products and keeps more profit from every dollar of sales.`,
    },
    {
      title: 'Strong Balance Sheet & Liquidity Buffer',
      impactScore: 8.2,
      horizon: 'Medium-term',
      explanation: `Robust free cash flow generation enables aggressive R&D reinvestment and institutional buybacks.`,
      eli5Explanation: `They have plenty of cash in the bank to fund future growth and weather tough times.`,
    },
    {
      title: 'Structural Secular Growth Tailwinds',
      impactScore: 7.9,
      horizon: 'Long-term',
      explanation: `Leveraged to long-duration industry transformation and multi-year capex expansion cycles.`,
      eli5Explanation: `The entire industry is growing quickly, lifting top companies with it.`,
    },
  ];

  const bearish: QualitativeDriver[] = [
    {
      title: 'Macroeconomic Sensitivity & Valuation Premium',
      impactScore: 6.8,
      horizon: 'Immediate',
      explanation: `Beta of ${ticker.beta.toFixed(2)} leaves the stock susceptible to broad market multiple contractions.`,
      eli5Explanation: `Because this stock moves faster than the overall market, broad pullbacks can hit it harder.`,
    },
    {
      title: 'Competitive Density & Margin Defense',
      impactScore: 6.4,
      horizon: 'Medium-term',
      explanation: `Emerging peers investing heavily into alternative solutions may challenge terminal pricing power.`,
      eli5Explanation: `Competitors are racing to build cheaper alternatives, which could pressure profit margins.`,
    },
  ];

  const catalysts: CatalystItem[] = [
    {
      event: 'Upcoming Quarterly Earnings Release',
      timeframe: 'Next 30 Days',
      expectedImpact: 'High',
      bias: 'Bullish',
      detail: 'Management guidance on forward revenue pipeline and gross margin trajectory.',
    },
    {
      event: 'Institutional Investor & Product Day',
      timeframe: 'Upcoming Quarter',
      expectedImpact: 'Moderate',
      bias: 'Bullish',
      detail: 'Key technology updates, partner announcements, and capital allocation updates.',
    },
  ];

  return {
    ticker: ticker.symbol,
    lastUpdated: 'Live Heuristic Engine',
    executiveSummary: `${ticker.name} demonstrates solid competitive positioning within ${ticker.sector}, with valuation supported by cash flow durability.`,
    eli5Summary: `${ticker.name} is a key company in ${ticker.sector} with strong loyal customers and expanding sales.`,
    bullishDrivers: bullish,
    bearishRisks: bearish,
    keyCatalysts: catalysts,
    llmSuggestedDrift: ticker.drift,
    llmSuggestedVol: ticker.volatility,
    confidenceScore: 85,
    source: 'institutional_archive',
  };
}
