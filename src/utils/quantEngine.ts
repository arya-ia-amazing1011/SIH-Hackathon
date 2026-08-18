import { MonteCarloParams, MonteCarloResults, SimulationStepPoint, StockTicker, HistoricalDataPoint, VolatilityConePoint } from '../types';

/**
 * Standard Box-Muller transform for generating normally distributed random numbers N(0, 1)
 */
function generateStandardNormal(): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Calculate percentile of a sorted number array
 */
function getPercentile(sortedArr: number[], percentile: number): number {
  if (sortedArr.length === 0) return 0;
  const clampedP = Math.max(0, Math.min(100, percentile));
  const index = (clampedP / 100) * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  if (upper === lower) return sortedArr[lower];
  return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
}

/**
 * Format date string from offset days from today
 */
function formatFutureDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: offsetDays > 365 ? '2-digit' : undefined });
}

/**
 * Run Geometric Brownian Motion Monte Carlo Simulation
 */
export function runMonteCarloSimulation(params: MonteCarloParams): MonteCarloResults {
  const {
    initialPrice,
    volatility,
    drift,
    horizonDays,
    simulationsCount,
    riskFreeRate,
    qualitativeDriftShift,
    confidenceInterval = 90,
  } = params;

  // Total adjusted annual drift includes qualitative shift
  const effectiveDrift = drift + qualitativeDriftShift;
  const dtYears = 1 / 365; // daily time step
  const totalSteps = horizonDays;
  
  // Ultra high-density checkpoint sampling for crisp, authentic jagged daily price action:
  const stepInterval = horizonDays <= 90
    ? 1
    : horizonDays <= 180
    ? 1
    : horizonDays <= 365
    ? 1
    : horizonDays <= 730
    ? 2
    : 3;

  const checkpointDays: number[] = [0];
  for (let d = stepInterval; d < totalSteps; d += stepInterval) {
    checkpointDays.push(d);
  }
  if (checkpointDays[checkpointDays.length - 1] !== totalSteps) {
    checkpointDays.push(totalSteps);
  }

  // Pre-allocate simulations
  const N = Math.max(60, Math.min(simulationsCount, 2500));
  const paths: number[][] = Array.from({ length: N }, () => new Array(checkpointDays.length));

  // Visual sample paths count: 15 distinct representative stochastic paths across distribution spectrum
  const visualSampleCount = 15;
  const visualIndices = Array.from({ length: visualSampleCount }, (_, i) => {
    return Math.min(N - 1, Math.floor((i / (visualSampleCount - 1 || 1)) * (N - 1)));
  });

  // Initialize step 0
  for (let i = 0; i < N; i++) {
    paths[i][0] = initialPrice;
  }

  // Drift and diffusion constants for 1 day with Ito correction
  const driftTerm = (effectiveDrift - 0.5 * volatility * volatility) * dtYears;
  const diffusionTerm = volatility * Math.sqrt(dtYears);

  // Maximum peak-to-trough drawdown accumulator
  let totalSimDrawdown = 0;

  // Run simulation day by day, recording checkpoints
  const currentPrices = new Float64Array(N).fill(initialPrice);
  const peakPrices = new Float64Array(N).fill(initialPrice);
  const maxDrawdowns = new Float64Array(N).fill(0);

  let checkpointIdx = 1;

  for (let day = 1; day <= totalSteps; day++) {
    for (let i = 0; i < N; i++) {
      const z = generateStandardNormal();
      // Realistic high-frequency market micro-shocks (intraday bid-ask variance & sudden news jumps)
      const fatTailShock = (Math.random() < 0.08) ? generateStandardNormal() * (volatility * 0.04) : 0;
      
      // S_{t+1} = S_t * exp(driftTerm + diffusionTerm * Z + shock)
      const newPrice = Math.max(0.01, currentPrices[i] * Math.exp(driftTerm + diffusionTerm * z + fatTailShock));
      currentPrices[i] = newPrice;

      if (newPrice > peakPrices[i]) {
        peakPrices[i] = newPrice;
      } else {
        const drawdown = (peakPrices[i] - newPrice) / peakPrices[i];
        if (drawdown > maxDrawdowns[i]) {
          maxDrawdowns[i] = drawdown;
        }
      }
    }

    if (checkpointIdx < checkpointDays.length && day === checkpointDays[checkpointIdx]) {
      for (let i = 0; i < N; i++) {
        paths[i][checkpointIdx] = currentPrices[i];
      }
      checkpointIdx++;
    }
  }

  for (let i = 0; i < N; i++) {
    totalSimDrawdown += maxDrawdowns[i];
  }

  // Calculate lower and upper percentile tails for confidence interval
  // e.g. 90% CI -> [5%, 95%], 95% CI -> [2.5%, 97.5%], 99% CI -> [0.5%, 99.5%]
  const tailAlpha = (100 - confidenceInterval) / 2;
  const ciLowerP = tailAlpha;
  const ciUpperP = 100 - tailAlpha;

  // Compile trajectories with percentiles at each checkpoint
  const trajectories: SimulationStepPoint[] = [];

  for (let c = 0; c < checkpointDays.length; c++) {
    const day = checkpointDays[c];
    const stepPrices = paths.map(p => p[c]).sort((a, b) => a - b);

    const p5 = getPercentile(stepPrices, 5);
    const p25 = getPercentile(stepPrices, 25);
    const median = getPercentile(stepPrices, 50);
    const p75 = getPercentile(stepPrices, 75);
    const p95 = getPercentile(stepPrices, 95);
    const ciLower = getPercentile(stepPrices, ciLowerP);
    const ciUpper = getPercentile(stepPrices, ciUpperP);
    const sum = stepPrices.reduce((acc, v) => acc + v, 0);
    const mean = sum / stepPrices.length;

    const point: SimulationStepPoint = {
      day,
      dateStr: formatFutureDate(day),
      p5: Number(p5.toFixed(2)),
      p25: Number(p25.toFixed(2)),
      median: Number(median.toFixed(2)),
      p75: Number(p75.toFixed(2)),
      p95: Number(p95.toFixed(2)),
      mean: Number(mean.toFixed(2)),
      ciLower: Number(ciLower.toFixed(2)),
      ciUpper: Number(ciUpper.toFixed(2)),
    };

    // Attach the 15 diverse simulation paths
    visualIndices.forEach((simIdx, vIdx) => {
      point[`path_${vIdx}`] = Number(paths[simIdx][c].toFixed(2));
    });

    trajectories.push(point);
  }

  // Analyze final prices
  const finalPrices = Array.from(currentPrices).sort((a, b) => a - b);
  const medianFinalPrice = getPercentile(finalPrices, 50);
  const meanFinalPrice = finalPrices.reduce((a, b) => a + b, 0) / finalPrices.length;
  const p5FinalPrice = getPercentile(finalPrices, 5);
  const p1FinalPrice = getPercentile(finalPrices, 1);
  const p95FinalPrice = getPercentile(finalPrices, 95);
  const ciLowerFinalPrice = getPercentile(finalPrices, ciLowerP);
  const ciUpperFinalPrice = getPercentile(finalPrices, ciUpperP);

  // Probability of positive return
  const profitCount = finalPrices.filter(p => p > initialPrice).length;
  const probabilityOfProfit = (profitCount / N) * 100;

  // Value at Risk (VaR 95% and 99%)
  const var95Loss = Math.max(0, initialPrice - p5FinalPrice);
  const var95Percent = (var95Loss / initialPrice) * 100;

  const var99Loss = Math.max(0, initialPrice - p1FinalPrice);
  const var99Percent = (var99Loss / initialPrice) * 100;

  // Conditional VaR (Expected Shortfall): Average loss in worst 5% outcomes
  const tail5Count = Math.max(1, Math.floor(N * 0.05));
  const worst5Prices = finalPrices.slice(0, tail5Count);
  const avgWorstPrice = worst5Prices.reduce((a, b) => a + b, 0) / worst5Prices.length;
  const cvar95Dollar = Math.max(0, initialPrice - avgWorstPrice);
  const cvar95Percent = (cvar95Dollar / initialPrice) * 100;

  // Sharpe Ratio = (Expected Return - Risk Free Rate) / Volatility
  const expectedReturn = effectiveDrift;
  const sharpeRatio = volatility > 0 ? (expectedReturn - riskFreeRate) / volatility : 0;

  // Average Max Drawdown across simulations
  const maxExpectedDrawdownPercent = (totalSimDrawdown / N) * 100;

  // Gain/Loss ratio
  const upsideGains = finalPrices.filter(p => p > initialPrice).map(p => p - initialPrice);
  const downsideLosses = finalPrices.filter(p => p < initialPrice).map(p => initialPrice - p);
  const avgGain = upsideGains.length > 0 ? upsideGains.reduce((a, b) => a + b, 0) / upsideGains.length : 0;
  const avgLoss = downsideLosses.length > 0 ? downsideLosses.reduce((a, b) => a + b, 0) / downsideLosses.length : 1;
  const expectedGainLossRatio = avgLoss > 0 ? avgGain / avgLoss : avgGain;

  return {
    trajectories,
    finalPrices,
    currentPrice: initialPrice,
    medianFinalPrice: Number(medianFinalPrice.toFixed(2)),
    meanFinalPrice: Number(meanFinalPrice.toFixed(2)),
    p5FinalPrice: Number(p5FinalPrice.toFixed(2)),
    p95FinalPrice: Number(p95FinalPrice.toFixed(2)),
    ciLowerFinalPrice: Number(ciLowerFinalPrice.toFixed(2)),
    ciUpperFinalPrice: Number(ciUpperFinalPrice.toFixed(2)),
    confidenceLevel: confidenceInterval,
    probabilityOfProfit: Number(probabilityOfProfit.toFixed(1)),
    var95Dollar: Number(var95Loss.toFixed(2)),
    var95Percent: Number(var95Percent.toFixed(1)),
    var99Dollar: Number(var99Loss.toFixed(2)),
    var99Percent: Number(var99Percent.toFixed(1)),
    cvar95Dollar: Number(cvar95Dollar.toFixed(2)),
    cvar95Percent: Number(cvar95Percent.toFixed(1)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    maxExpectedDrawdownPercent: Number(maxExpectedDrawdownPercent.toFixed(1)),
    expectedGainLossRatio: Number(expectedGainLossRatio.toFixed(2)),
  };
}

/**
 * Generate historical price action and rolling volatility metrics for a given ticker
 */
export function generateHistoricalVolatilitySeries(ticker: StockTicker, periodDays: number = 252): HistoricalDataPoint[] {
  const points: HistoricalDataPoint[] = [];
  const currentPrice = ticker.price;
  const vol = ticker.volatility;
  const drift = ticker.drift;

  // Generate backwards synthetic price series with realistic volatility clustering
  const dailyDt = 1 / 252;
  const rawPrices: number[] = new Array(periodDays);
  const dailyReturns: number[] = new Array(periodDays);

  // Set today's price at the end
  rawPrices[periodDays - 1] = currentPrice;

  // Deterministic seed generation based on ticker symbol char codes
  let seed = ticker.symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 100);
  const pseudoRand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Walk backwards from current price
  for (let i = periodDays - 2; i >= 0; i--) {
    const u1 = Math.max(0.0001, pseudoRand());
    const u2 = Math.max(0.0001, pseudoRand());
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    // Period specific volatility burst (e.g. earnings or macro regime)
    const volRegimeFactor = 1 + 0.3 * Math.sin(i / 15);
    const dayReturn = (drift * dailyDt) + (vol * volRegimeFactor * Math.sqrt(dailyDt) * z);
    dailyReturns[i + 1] = dayReturn;

    // Previous price
    const prevPrice = Math.max(1, rawPrices[i + 1] / Math.exp(dayReturn));
    rawPrices[i] = prevPrice;
  }
  dailyReturns[0] = (drift * dailyDt);

  // Calculate 30-day rolling realized volatility and 2-sigma bands
  const today = new Date();
  for (let i = 0; i < periodDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (periodDays - 1 - i));
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // 30-day window standard deviation
    const windowStart = Math.max(0, i - 29);
    const windowSlice = dailyReturns.slice(windowStart, i + 1);
    const meanRet = windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length;
    const variance = windowSlice.reduce((acc, r) => acc + Math.pow(r - meanRet, 2), 0) / (windowSlice.length || 1);
    const rollingVol30D = Math.sqrt(variance * 252) * 100; // Annualized percentage

    const price = rawPrices[i];
    const bandSpread = price * (rollingVol30D / 100) * Math.sqrt(30 / 252);
    const upperBand = price + bandSpread;
    const lowerBand = Math.max(0.5, price - bandSpread);

    points.push({
      date: dateStr,
      price: Number(price.toFixed(2)),
      rollingVol30D: Number(rollingVol30D.toFixed(1)),
      upperBand: Number(upperBand.toFixed(2)),
      lowerBand: Number(lowerBand.toFixed(2)),
      dailyReturn: Number((dailyReturns[i] * 100).toFixed(2)),
      volume: Math.floor(1000000 + pseudoRand() * 5000000),
    });
  }

  return points;
}

/**
 * Generate historical volatility term structure / cone for a ticker
 */
export function generateVolatilityCone(ticker: StockTicker): VolatilityConePoint[] {
  const baseVol = ticker.volatility * 100;

  const tenors = [
    { label: '10D', days: 10, factor: 1.15 },
    { label: '30D', days: 30, factor: 1.0 },
    { label: '60D', days: 60, factor: 0.94 },
    { label: '90D', days: 90, factor: 0.90 },
    { label: '180D', days: 180, factor: 0.86 },
    { label: '1Y', days: 365, factor: 0.82 },
  ];

  return tenors.map(t => {
    const median = Number((baseVol * t.factor).toFixed(1));
    const minVol = Number((median * 0.55).toFixed(1));
    const p25Vol = Number((median * 0.80).toFixed(1));
    const p75Vol = Number((median * 1.25).toFixed(1));
    const maxVol = Number((median * 1.70).toFixed(1));
    const currentRealizedVol = Number((median * (0.92 + (ticker.beta > 1.5 ? 0.15 : 0.04))).toFixed(1));
    const impliedVol = Number((currentRealizedVol * 1.08).toFixed(1));

    return {
      tenor: t.label,
      days: t.days,
      minVol,
      p25Vol,
      medianVol: median,
      p75Vol,
      maxVol,
      currentRealizedVol,
      impliedVol,
    };
  });
}
