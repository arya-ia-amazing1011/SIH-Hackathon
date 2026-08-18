import React, { useState } from 'react';
import { StockTicker, MonteCarloResults, QualitativeSynthesis, MacroScenario, Mode, TimeHorizon } from '../types';
import { X, Copy, Check, Sparkles, Download, TrendingUp, ShieldAlert, Award, FileText, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PitchCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: StockTicker;
  results: MonteCarloResults;
  synthesis: QualitativeSynthesis;
  activeScenario: MacroScenario | null;
  horizonDays: TimeHorizon;
  volatility: number;
  drift: number;
  mode: Mode;
}

export const PitchCardModal: React.FC<PitchCardModalProps> = ({
  isOpen,
  onClose,
  ticker,
  results,
  synthesis,
  activeScenario,
  horizonDays,
  volatility,
  drift,
  mode,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currencySymbol = ticker.currency === 'INR' ? '₹' : '$';
  const medianRoi = ((results.medianFinalPrice - results.currentPrice) / results.currentPrice) * 100;
  const p95Roi = ((results.p95FinalPrice - results.currentPrice) / results.currentPrice) * 100;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#06B6D4', '#10B981', '#F59E0B'],
      });
    } catch {
      // ignore
    }
  };

  const handleCopyText = () => {
    const textSummary = `=== QUANTPILOT EXECUTIVE PITCH CARD ===
ASSET: ${ticker.symbol} (${ticker.name}) | SECTOR: ${ticker.sector}
SPOT PRICE: ${currencySymbol}${ticker.price.toFixed(2)} | HORIZON: ${horizonDays} Days

--- QUANTITATIVE MONTE CARLO FORECASTS ---
* Median Target (50th %ile): ${currencySymbol}${results.medianFinalPrice.toFixed(2)} (${medianRoi >= 0 ? '+' : ''}${medianRoi.toFixed(1)}%)
* Bullish Bound (95th %ile): ${currencySymbol}${results.p95FinalPrice.toFixed(2)} (${p95Roi >= 0 ? '+' : ''}${p95Roi.toFixed(1)}%)
* Value at Risk (VaR 95%): -${results.var95Percent.toFixed(1)}% (-${currencySymbol}${results.var95Dollar.toFixed(2)})
* Probability of Positive Return: ${results.probabilityOfProfit.toFixed(1)}%
* Sharpe Ratio: ${results.sharpeRatio.toFixed(2)} | Annual Volatility: ${(volatility * 100).toFixed(0)}%

--- MACRO SCENARIO STRESS-TEST ---
${activeScenario ? `Active Scenario: ${activeScenario.title}\nImpact: ${activeScenario.description}` : 'Baseline Stochastic Macro Environment'}

--- CORE INVESTMENT THESIS ---
${synthesis.executiveSummary}

Key Bullish Catalyst: ${synthesis.bullishDrivers[0]?.title || 'Margin Expansion'}
Key Risk Factor: ${synthesis.bearishRisks[0]?.title || 'Macro multiple contraction'}

Generated via QuantPilot Institutional Stochastic Decision Support Engine.`;

    navigator.clipboard.writeText(textSummary);
    setCopied(true);
    triggerConfetti();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
        {/* Modal Content Container */}
        <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-[#1E293B] shadow-2xl p-5 sm:p-6 space-y-4 my-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/40 flex items-center justify-center">
                <FileText className="h-4 w-4 text-[#06B6D4]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white font-mono tracking-wider">EXECUTIVE PITCH MEMO</h2>
                <p className="text-[11px] text-slate-400">Institutional deck snapshot & committee decision summary</p>
              </div>
            </div>
            <span className="rounded bg-slate-900 border border-slate-700 px-2 py-0.5 text-[10px] font-mono text-[#06B6D4] font-bold">
              {ticker.symbol}
            </span>
          </div>

          {/* Pitch Card Body (Designed for clean screenshots & printing) */}
          <div
            id="pitch-card-printable"
            className="rounded-xl border border-slate-700/80 bg-[#0F172A] p-4 sm:p-5 space-y-3.5 shadow-inner"
          >
            {/* Card Top Brand & Ticker */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-white font-mono">{ticker.symbol}</span>
                  <span className="text-xs text-slate-400 font-mono">({ticker.name})</span>
                </div>
                <span className="text-[11px] text-[#06B6D4] font-mono">{ticker.sector} • {ticker.exchange}</span>
              </div>
              <div className="text-right font-mono">
                <div className="text-base font-bold text-white">
                  {currencySymbol}{ticker.price.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-400">Spot Baseline</div>
              </div>
            </div>

            {/* Key Metric Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <div className="text-[9px] text-slate-400 uppercase">Target ({horizonDays}D)</div>
                <div className="text-sm font-bold text-[#06B6D4] mt-0.5">
                  {currencySymbol}{results.medianFinalPrice.toFixed(2)}
                </div>
                <div className={`text-[9px] font-semibold ${medianRoi >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {medianRoi >= 0 ? '+' : ''}{medianRoi.toFixed(1)}% Exp.
                </div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <div className="text-[9px] text-slate-400 uppercase">VaR (95% Quantile)</div>
                <div className="text-sm font-bold text-[#EF4444] mt-0.5">
                  -{results.var95Percent.toFixed(1)}%
                </div>
                <div className="text-[9px] text-slate-400">
                  -{currencySymbol}{results.var95Dollar.toFixed(2)}
                </div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <div className="text-[9px] text-slate-400 uppercase">Win Probability</div>
                <div className="text-sm font-bold text-[#10B981] mt-0.5">
                  {results.probabilityOfProfit.toFixed(1)}%
                </div>
                <div className="text-[9px] text-slate-400">P(Gain &gt; 0)</div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <div className="text-[9px] text-slate-400 uppercase">Sharpe Ratio</div>
                <div className="text-sm font-bold text-indigo-400 mt-0.5">
                  {results.sharpeRatio.toFixed(2)}
                </div>
                <div className="text-[9px] text-slate-400">Vol: {(volatility * 100).toFixed(0)}%</div>
              </div>
            </div>

            {/* Active Macro Stress Scenario if applicable */}
            {activeScenario && (
              <div className="rounded bg-slate-900/80 border border-purple-800/50 p-2.5 text-[11px]">
                <span className="font-bold text-purple-300 font-mono">STRESS SCENARIO APPLIED: </span>
                <span className="text-white font-medium">{activeScenario.title}</span>
                <p className="text-[10px] text-slate-400 mt-0.5">{activeScenario.description}</p>
              </div>
            )}

            {/* Executive Qualitative Thesis */}
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold font-mono text-[#06B6D4] uppercase tracking-wider">
                INVESTMENT COMMITTEE THESIS
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800 font-sans">
                {synthesis.executiveSummary}
              </p>
            </div>

            {/* Key Drivers & Risks Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-[#10B981]/5 border border-[#10B981]/30 p-2.5 rounded">
                <span className="font-bold font-mono text-[#10B981] uppercase text-[10px]">Primary Upside Driver</span>
                <p className="font-semibold text-white text-[11px] mt-0.5">{synthesis.bullishDrivers[0]?.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 font-sans">{synthesis.bullishDrivers[0]?.explanation}</p>
              </div>

              <div className="bg-[#EF4444]/5 border border-[#EF4444]/30 p-2.5 rounded">
                <span className="font-bold font-mono text-[#EF4444] uppercase text-[10px]">Primary Downside Risk</span>
                <p className="font-semibold text-white text-[11px] mt-0.5">{synthesis.bearishRisks[0]?.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 font-sans">{synthesis.bearishRisks[0]?.explanation}</p>
              </div>
            </div>

            {/* Footer Watermark */}
            <div className="flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-800 pt-1.5 font-mono">
              <span>Powered by QuantPilot • Institutional Decision Support Engine</span>
              <span>Date: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 rounded bg-[#06B6D4] px-4 py-1.5 text-xs font-mono font-bold text-slate-950 hover:bg-[#06B6D4]/90 transition shadow-md shadow-[#06B6D4]/20 active:scale-95"
            >
              {copied ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Summary Copied!' : 'Copy Formatted Pitch Summary'}</span>
            </button>
          </div>
        </div>
    </div>
  );
};
