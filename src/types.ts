export type Mode = 'student' | 'pro';

export type TimeHorizon = 30 | 90 | 180 | 365 | 730 | 1825;

export type ViewTab = 'all' | 'simulator' | 'macro' | 'qualitative';

export type ChartMode = 'forecast' | 'historical';

export interface StockTicker {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  high52: number;
  low52: number;
  volatility: number; // e.g. 0.35 for 35%
  drift: number; // e.g. 0.15 for 15%
  beta: number;
  peRatio: number;
  marketCap: string;
  sector: string;
  exchange: string;
  description: string;
  eli5Description?: string;
  studentDescription?: string;
}

export interface MonteCarloParams {
  initialPrice: number;
  volatility: number; // annualized volatility e.g. 0.32
  drift: number; // annualized expected return e.g. 0.12
  horizonDays: number; // 30, 90, 180, 365, 730, 1825
  simulationsCount: number; // e.g. 500
  riskFreeRate: number; // e.g. 0.045 (4.5%)
  qualitativeDriftShift: number; // user weight shift e.g. +0.03
  confidenceInterval?: number; // e.g. 90, 95, 99 (50 to 99)
}

export interface SimulationStepPoint {
  day: number;
  dateStr: string;
  p5: number;
  p25: number;
  median: number;
  p75: number;
  p95: number;
  mean: number;
  ciLower: number; // Lower bound for selected confidence interval
  ciUpper: number; // Upper bound for selected confidence interval
  [key: `path_${number}`]: number;
}

export interface MonteCarloResults {
  trajectories: SimulationStepPoint[];
  finalPrices: number[];
  currentPrice: number;
  medianFinalPrice: number;
  meanFinalPrice: number;
  p5FinalPrice: number;
  p95FinalPrice: number;
  ciLowerFinalPrice: number;
  ciUpperFinalPrice: number;
  confidenceLevel: number;
  probabilityOfProfit: number; // 0 - 100%
  var95Dollar: number; // VaR 95% in dollars
  var95Percent: number; // VaR 95% in percentage
  var99Dollar: number; // VaR 99% in dollars
  var99Percent: number; // VaR 99% in percentage
  cvar95Dollar: number; // Expected Shortfall
  cvar95Percent: number;
  sharpeRatio: number;
  maxExpectedDrawdownPercent: number;
  expectedGainLossRatio: number;
}

export interface HistoricalDataPoint {
  date: string;
  price: number;
  rollingVol30D: number; // annualized e.g. 35.2%
  upperBand: number;
  lowerBand: number;
  dailyReturn: number;
  volume: number;
  isLiveTick?: boolean;
}

export interface VolatilityConePoint {
  tenor: string;
  days: number;
  minVol: number;
  p25Vol: number;
  medianVol: number;
  p75Vol: number;
  maxVol: number;
  currentRealizedVol: number;
  impliedVol: number;
}

export interface MacroScenario {
  id: string;
  title: string;
  category: 'earnings_beat' | 'points_drop' | 'tech_breakthrough' | 'customer_shock' | 'regulatory' | 'custom' | 'monetary' | 'corporate' | 'commodity' | 'geopolitical' | 'tech';
  description: string;
  eli5Description?: string;
  studentDescription?: string;
  defaultDriftShift: number; // e.g. -0.10 for -10%
  defaultVolShift: number; // e.g. +0.15 for +15%
  probability: 'High' | 'Medium' | 'Low';
  historicalAnalogy: string;
  pointsImpact?: string;
}

export interface QualitativeDriver {
  title: string;
  impactScore: number; // 1 to 10
  horizon: 'Immediate' | 'Medium-term' | 'Long-term';
  explanation: string;
  eli5Explanation?: string;
  studentExplanation?: string;
}

export interface CatalystItem {
  event: string;
  timeframe: string;
  expectedImpact: 'High' | 'Moderate' | 'Low';
  bias: 'Bullish' | 'Bearish' | 'Neutral';
  detail: string;
}

export interface QualitativeSynthesis {
  ticker: string;
  lastUpdated: string;
  executiveSummary: string;
  eli5Summary?: string;
  studentSummary?: string;
  bullishDrivers: QualitativeDriver[];
  bearishRisks: QualitativeDriver[];
  keyCatalysts: CatalystItem[];
  llmSuggestedDrift: number;
  llmSuggestedVol: number;
  confidenceScore: number; // 0 - 100%
  source: 'gemini' | 'institutional_archive';
}

export interface TerminologyItem {
  term: string;
  proName: string;
  eli5Name?: string;
  studentName?: string;
  proDefinition: string;
  eli5Definition?: string;
  studentDefinition?: string;
}

