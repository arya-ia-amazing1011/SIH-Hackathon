import React, { useState } from 'react';
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Area,
  ComposedChart,
} from 'recharts';
import { SimulationStepPoint, Mode, TimeHorizon, ChartMode, StockTicker, MonteCarloResults } from '../types';
import { HistoricalVolatilityViewer } from './HistoricalVolatilityViewer';
import {
  RefreshCw,
  Eye,
  EyeOff,
  Layers,
  Zap,
  Maximize2,
  Minimize2,
  Activity,
  Sliders,
  TrendingUp,
  BarChart2,
} from 'lucide-react';

interface MonteCarloChartProps {
  trajectories: SimulationStepPoint[];
  results: MonteCarloResults;
  ticker: StockTicker;
  initialPrice: number;
  currency: string;
  horizonDays: TimeHorizon;
  onChangeHorizon: (horizon: TimeHorizon) => void;
  confidenceInterval: number;
  onChangeConfidenceInterval: (ci: number) => void;
  simulationsCount: number;
  onChangeSimCount: (count: number) => void;
  onRerunSimulation: () => void;
  mode: Mode;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// 15 distinct translucent spectral colors for the stochastic simulation bundle
const PATH_COLORS = [
  'rgba(6, 182, 212, 0.40)',   // Cyan
  'rgba(56, 189, 248, 0.35)',  // Sky
  'rgba(99, 102, 241, 0.35)',  // Indigo
  'rgba(168, 85, 247, 0.32)',  // Purple
  'rgba(236, 72, 153, 0.30)',  // Pink
  'rgba(16, 185, 129, 0.35)',  // Emerald
  'rgba(245, 158, 11, 0.32)',  // Amber
  'rgba(14, 165, 233, 0.35)',  // Light Blue
  'rgba(244, 63, 94, 0.30)',   // Rose
  'rgba(139, 92, 246, 0.34)',  // Violet
  'rgba(20, 184, 166, 0.35)',  // Teal
  'rgba(251, 146, 60, 0.32)',  // Orange
  'rgba(132, 204, 22, 0.32)',  // Lime
  'rgba(148, 163, 184, 0.35)', // Slate
  'rgba(217, 70, 239, 0.30)',  // Fuchsia
];

export const MonteCarloChart: React.FC<MonteCarloChartProps> = ({
  trajectories,
  results,
  ticker,
  initialPrice,
  currency,
  horizonDays,
  onChangeHorizon,
  confidenceInterval,
  onChangeConfidenceInterval,
  simulationsCount,
  onChangeSimCount,
  onRerunSimulation,
  mode,
  isExpanded,
  onToggleExpand,
}) => {
  const [chartViewMode, setChartViewMode] = useState<ChartMode>('forecast');
  const [showSamplePaths, setShowSamplePaths] = useState(true);
  const [showConfidenceBands, setShowConfidenceBands] = useState(true);
  const [useLogScale, setUseLogScale] = useState(false);

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Calculate dynamic min and max for chart YAxis based on trajectory bounds
  const allLower = trajectories.map(t => Math.min(t.ciLower, t.p5));
  const allUpper = trajectories.map(t => Math.max(t.ciUpper, t.p95));
  const minVal = Math.max(0.5, Math.min(...allLower) * 0.85);
  const maxVal = Math.max(...allUpper) * 1.15;

  // Bottom Duration options as requested: 1 Month, 3 Months, 6 Months, 1 Year, 2 Years, 5 Years
  const durationTabs: { label: string; value: TimeHorizon; subtitle: string }[] = [
    { label: '1 MONTH', value: 30, subtitle: '30D' },
    { label: '3 MONTHS', value: 90, subtitle: '90D' },
    { label: '6 MONTHS', value: 180, subtitle: '180D' },
    { label: '1 YEAR', value: 365, subtitle: '365D' },
    { label: '2 YEARS', value: 730, subtitle: '730D' },
    { label: '5 YEARS', value: 1825, subtitle: '1825D' },
  ];

  const ciPresets = [80, 90, 95, 99];
  const simCountOptions = [100, 250, 500, 1000];
  const samplePathKeys = Array.from({ length: 15 }, (_, i) => `path_${i}`);

  const finalPoint = trajectories[trajectories.length - 1] || trajectories[0];
  const medianRoi = finalPoint ? ((finalPoint.median - initialPrice) / initialPrice) * 100 : 0;
  const ciUpperRoi = finalPoint ? ((finalPoint.ciUpper - initialPrice) / initialPrice) * 100 : 0;
  const ciLowerRoi = finalPoint ? ((finalPoint.ciLower - initialPrice) / initialPrice) * 100 : 0;

  return (
    <div
      className={`rounded-xl border border-slate-700/70 bg-[#1E293B] shadow-xl transition-all duration-200 ${
        isExpanded ? 'p-5 ring-1 ring-[#06B6D4]/40' : 'p-3.5 sm:p-4'
      }`}
    >
      {/* Top Header: Main View Mode Tabs & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-700/60">
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Chart View Switcher: Monte Carlo Forecast vs Historical Volatility */}
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setChartViewMode('forecast')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold font-mono rounded transition ${
                chartViewMode === 'forecast'
                  ? 'bg-[#06B6D4] text-[#0F172A] shadow-md shadow-[#06B6D4]/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>MONTE CARLO FORECAST</span>
            </button>

            <button
              onClick={() => setChartViewMode('historical')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold font-mono rounded transition ${
                chartViewMode === 'historical'
                  ? 'bg-[#06B6D4] text-[#0F172A] shadow-md shadow-[#06B6D4]/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>HISTORICAL VOLATILITY</span>
              <span className="hidden sm:inline-block text-[9px] bg-slate-800 text-cyan-300 px-1 py-0.2 rounded font-sans">
                PAST
              </span>
            </button>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 rounded bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-2 py-0.5 text-[10px] font-bold text-[#06B6D4] font-mono">
            <Activity className="h-3 w-3" /> 15 PATH JUMBLE + TREND
          </span>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {/* Simulation run count */}
          {chartViewMode === 'forecast' && (
            <div className="hidden sm:flex items-center gap-0.5 bg-slate-900 p-0.5 rounded border border-slate-700 text-[10px]">
              <span className="px-1 text-slate-500 text-[9px]">RUNS:</span>
              {simCountOptions.map(count => (
                <button
                  key={count}
                  onClick={() => onChangeSimCount(count)}
                  className={`px-1.5 py-0.5 rounded transition ${
                    simulationsCount === count
                      ? 'bg-slate-700 text-[#06B6D4] font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          )}

          {/* Log scale toggle */}
          {chartViewMode === 'forecast' && (
            <button
              onClick={() => setUseLogScale(!useLogScale)}
              className={`px-2 py-1 text-[10px] rounded border transition ${
                useLogScale
                  ? 'bg-slate-700 border-[#06B6D4] text-[#06B6D4]'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Logarithmic Scale"
            >
              LOG
            </button>
          )}

          {/* Rerun simulation button */}
          {chartViewMode === 'forecast' && (
            <button
              onClick={onRerunSimulation}
              className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-200 hover:border-[#06B6D4] hover:text-[#06B6D4] transition"
              title="Re-seed Monte Carlo stochastic paths"
            >
              <RefreshCw className="h-3 w-3 text-[#06B6D4]" />
              <span>RERUN</span>
            </button>
          )}

          {/* Expand / Maximize Toggle */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-slate-300 hover:text-[#06B6D4] hover:border-[#06B6D4] transition"
              title={isExpanded ? 'Exit Focus View' : 'Focus View'}
            >
              {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              <span className="hidden sm:inline">{isExpanded ? 'COLLAPSE' : 'FOCUS'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: MONTE CARLO FORECAST VIEW */}
      {/* ========================================================================= */}
      {chartViewMode === 'forecast' && (
        <div className="space-y-3 pt-2">
          {/* Interactive Confidence Interval Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 font-mono text-xs">
            {/* Slider & Presets */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 text-[#06B6D4]" />
                <span className="text-[11px] font-bold text-slate-200">
                  {mode === 'pro' ? 'CONFIDENCE INTERVAL (CI):' : 'CONFIDENCE ZONE:'}
                </span>
                <span className="text-sm font-bold text-[#06B6D4] bg-[#06B6D4]/10 px-1.5 py-0.2 rounded border border-[#06B6D4]/30">
                  {confidenceInterval}%
                </span>
              </div>

              {/* Slider Control */}
              <div className="flex items-center gap-2 min-w-[140px] sm:min-w-[180px]">
                <span className="text-[10px] text-slate-500">50%</span>
                <input
                  type="range"
                  min={50}
                  max={99}
                  step={1}
                  value={confidenceInterval}
                  onChange={e => onChangeConfidenceInterval(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#06B6D4]"
                  title="Adjust simulation confidence interval envelope"
                />
                <span className="text-[10px] text-slate-500">99%</span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
                {ciPresets.map(preset => (
                  <button
                    key={preset}
                    onClick={() => onChangeConfidenceInterval(preset)}
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition ${
                      confidenceInterval === preset
                        ? 'bg-[#06B6D4] text-[#0F172A]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>

            {/* Display Toggles */}
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <button
                onClick={() => setShowSamplePaths(!showSamplePaths)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded border transition ${
                  showSamplePaths
                    ? 'border-[#06B6D4]/40 bg-[#06B6D4]/10 text-[#06B6D4]'
                    : 'border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {showSamplePaths ? <Eye className="h-3 w-3 text-[#06B6D4]" /> : <EyeOff className="h-3 w-3" />}
                <span>15 Paths</span>
              </button>

              <button
                onClick={() => setShowConfidenceBands(!showConfidenceBands)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded border transition ${
                  showConfidenceBands
                    ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
                    : 'border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="h-3 w-3 text-indigo-400" />
                <span>{confidenceInterval}% CI Band</span>
              </button>
            </div>
          </div>

          {/* Metric Summary Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 font-mono">
            <div className="flex flex-wrap items-center gap-3">
              {/* Expected Trend */}
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-3.5 rounded-sm bg-[#06B6D4] ring-1 ring-cyan-300 inline-block" />
                <span className="text-slate-400 font-semibold">
                  {mode === 'pro' ? 'Median (50th Trend):' : 'Expected Path (Median):'}
                </span>
                <span className="font-bold text-[#06B6D4]">
                  {currencySymbol}{finalPoint.median.toFixed(2)} ({medianRoi >= 0 ? '+' : ''}{medianRoi.toFixed(1)}%)
                </span>
              </div>

              {/* Upper CI Bound */}
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-sm bg-[#10B981] inline-block" />
                <span className="text-slate-400">
                  {mode === 'pro' ? `Upper CI (${(100 - (100 - confidenceInterval) / 2).toFixed(1)}%):` : `Optimistic (${confidenceInterval}%):`}
                </span>
                <span className="font-bold text-[#10B981]">
                  {currencySymbol}{finalPoint.ciUpper.toFixed(2)} ({ciUpperRoi >= 0 ? '+' : ''}{ciUpperRoi.toFixed(1)}%)
                </span>
              </div>

              {/* Lower CI Bound */}
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-sm bg-[#EF4444] inline-block" />
                <span className="text-slate-400">
                  {mode === 'pro' ? `Lower CI (${((100 - confidenceInterval) / 2).toFixed(1)}%):` : `Downside Risk:`}
                </span>
                <span className="font-bold text-[#EF4444]">
                  {currencySymbol}{finalPoint.ciLower.toFixed(2)} ({ciLowerRoi.toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400">
              Win Rate: <strong className="text-[#10B981] font-mono">{results.probabilityOfProfit}%</strong>
            </div>
          </div>

          {/* Recharts Canvas */}
          <div className={`w-full pt-1 transition-all ${isExpanded ? 'h-96 sm:h-[450px]' : 'h-64 sm:h-80'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trajectories} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="iqrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="2 2" stroke="#334155" opacity={0.3} vertical={false} />

                <XAxis
                  dataKey="dateStr"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />

                <YAxis
                  domain={[minVal, maxVal]}
                  scale={useLogScale ? 'log' : 'auto'}
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={val => `${currencySymbol}${val.toFixed(0)}`}
                  width={55}
                />

                {/* Spot Price Baseline */}
                <ReferenceLine
                  y={initialPrice}
                  stroke="#94A3B8"
                  strokeDasharray="3 3"
                  label={{
                    value: `Spot: ${currencySymbol}${initialPrice.toFixed(1)}`,
                    fill: '#94A3B8',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    position: 'insideLeft',
                  }}
                />

                {/* Shaded Confidence Interval Envelope (Dynamic based on Slider) */}
                {showConfidenceBands && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="ciUpper"
                      stroke="none"
                      fill="url(#confidenceGradient)"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="p75"
                      stroke="none"
                      fill="url(#iqrGradient)"
                      isAnimationActive={false}
                    />
                  </>
                )}

                {/* 15 Individual Stochastic Sample Paths (Super Jagged Raw Brownian Cloud) */}
                {showSamplePaths &&
                  samplePathKeys.map((key, idx) => (
                    <Line
                      key={key}
                      type="linear"
                      dataKey={key}
                      stroke={PATH_COLORS[idx % PATH_COLORS.length]}
                      strokeWidth={1.3}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}

                {/* Dynamic Upper CI Bound Line */}
                <Line
                  type="linear"
                  dataKey="ciUpper"
                  name={`${confidenceInterval}% Upper Bound`}
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={false}
                  isAnimationActive={false}
                />

                {/* Central Overall Trend Highlight Line (Smooth Central Expectation) */}
                <Line
                  type="monotone"
                  dataKey="median"
                  name="Expected Trend (50th Median)"
                  stroke="#06B6D4"
                  strokeWidth={3.5}
                  dot={false}
                  isAnimationActive={false}
                />

                {/* Dynamic Lower CI Bound Line */}
                <Line
                  type="linear"
                  dataKey="ciLower"
                  name={`${confidenceInterval}% Lower Bound`}
                  stroke="#EF4444"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={false}
                  isAnimationActive={false}
                />

                {/* Custom Tooltip */}
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as SimulationStepPoint;
                      const currentMedian = data.median;
                      const currentRoi = ((currentMedian - initialPrice) / initialPrice) * 100;
                      const currentUpperRoi = ((data.ciUpper - initialPrice) / initialPrice) * 100;
                      const currentLowerRoi = ((data.ciLower - initialPrice) / initialPrice) * 100;

                      return (
                        <div className="rounded-lg border border-slate-700 bg-[#0F172A]/95 p-2.5 shadow-2xl backdrop-blur font-mono text-xs z-50">
                          <div className="flex items-center justify-between border-b border-slate-700 pb-1 mb-1.5">
                            <span className="font-bold text-white">
                              {data.dateStr} (Day {data.day})
                            </span>
                            <span className="text-[10px] text-[#06B6D4]">
                              {data.day}/{horizonDays}D Horizon
                            </span>
                          </div>

                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between items-center text-[#10B981]">
                              <span>{confidenceInterval}% Upper CI:</span>
                              <span className="font-bold">
                                {currencySymbol}{data.ciUpper.toFixed(2)} ({currentUpperRoi >= 0 ? '+' : ''}{currentUpperRoi.toFixed(1)}%)
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-[#06B6D4] font-bold bg-[#06B6D4]/10 px-1.5 py-0.5 rounded border border-[#06B6D4]/30">
                              <span>Median Trend:</span>
                              <span>
                                {currencySymbol}{data.median.toFixed(2)} ({currentRoi >= 0 ? '+' : ''}{currentRoi.toFixed(1)}%)
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-slate-300 text-[10px]">
                              <span>Middle 50% Range:</span>
                              <span>
                                {currencySymbol}{data.p25.toFixed(2)} - {currencySymbol}{data.p75.toFixed(2)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-[#EF4444]">
                              <span>{confidenceInterval}% Lower CI:</span>
                              <span className="font-bold">
                                {currencySymbol}{data.ciLower.toFixed(2)} ({currentLowerRoi.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* DURATION TAB BAR AT BOTTOM OF GRAPH */}
          <div className="pt-2.5 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2.5 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                SIMULATION DURATION:
              </span>
              <div className="flex flex-wrap bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                {durationTabs.map(tab => {
                  const isActive = horizonDays === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => onChangeHorizon(tab.value)}
                      className={`px-3 py-1 text-[10px] font-bold rounded transition flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#06B6D4] text-[#0F172A] shadow-md shadow-[#06B6D4]/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[9px] px-1 rounded ${
                        isActive ? 'bg-[#0F172A]/20 text-[#0F172A]' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {tab.subtitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-sans">
              {mode === 'pro'
                ? `Simulating ${horizonDays} trading daily steps with Ito lemma drift-diffusion.`
                : `Forecasting the next ${horizonDays} days into the future.`}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: HISTORICAL VOLATILITY & PRICE ACTION VIEW */}
      {/* ========================================================================= */}
      {chartViewMode === 'historical' && (
        <div className="pt-2">
          <HistoricalVolatilityViewer ticker={ticker} mode={mode} />
        </div>
      )}
    </div>
  );
};
