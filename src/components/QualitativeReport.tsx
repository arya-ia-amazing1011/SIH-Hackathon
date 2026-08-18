import React from 'react';
import { QualitativeSynthesis, Mode, StockTicker } from '../types';
import { ShieldCheck, ShieldAlert, Sparkles, Sliders, Calendar, ArrowUpRight, ArrowDownRight, Clock, RefreshCw } from 'lucide-react';

interface QualitativeReportProps {
  synthesis: QualitativeSynthesis;
  ticker: StockTicker;
  bullWeight: number; // 0 to 100
  bearWeight: number; // 0 to 100
  onChangeBullWeight: (val: number) => void;
  onChangeBearWeight: (val: number) => void;
  onRegenerateAiReport: () => void;
  isAiLoading: boolean;
  mode: Mode;
}

export const QualitativeReport: React.FC<QualitativeReportProps> = ({
  synthesis,
  ticker,
  bullWeight,
  bearWeight,
  onChangeBullWeight,
  onChangeBearWeight,
  onRegenerateAiReport,
  isAiLoading,
  mode,
}) => {
  // Qualitative drift shift formula:
  // Net weight = (bullWeight - bearWeight) / 100 * 0.08 (e.g. up to +/- 8% drift adjustment)
  const netShift = ((bullWeight - bearWeight) / 100) * 0.08;
  const netShiftPercent = (netShift * 100).toFixed(1);

  const displaySummary = mode === 'pro'
    ? synthesis.executiveSummary
    : (synthesis.studentSummary || synthesis.eli5Summary || synthesis.executiveSummary);

  return (
    <div className="rounded-xl border border-slate-700/70 bg-[#1E293B] p-3.5 sm:p-4 shadow-xl space-y-3.5">
      {/* Header & LLM Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2.5 border-b border-slate-700/60">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#06B6D4]" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#06B6D4] font-mono">
              {mode === 'pro'
                ? 'QUALITATIVE INTELLIGENCE & CATALYST MATRIX'
                : 'STUDENT REPORT: COMPANY STORY, CATALYSTS & RISKS'}
            </h3>
            <span className="rounded bg-slate-900 border border-slate-700 px-1.5 py-0.2 text-[9px] font-mono text-slate-300">
              {synthesis.source === 'gemini' ? 'Gemini 2.5 Live' : 'Archive Model'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
            {mode === 'pro'
              ? 'Fundamental catalysts translated into dynamic trajectory drift weights'
              : 'Learn what drives this company forward and what warning signs to watch out for'}
          </p>
        </div>

        <button
          onClick={onRegenerateAiReport}
          disabled={isAiLoading}
          className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-200 hover:border-[#06B6D4] hover:text-[#06B6D4] transition font-mono disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 text-[#06B6D4] ${isAiLoading ? 'animate-spin' : ''}`} />
          <span>{isAiLoading ? 'ANALYZING...' : 'RE-ANALYZE'}</span>
        </button>
      </div>

      {/* Executive Summary Card */}
      <div className="rounded-lg border border-slate-700/80 bg-[#0F172A]/70 p-3">
        <div className="text-[10px] font-bold font-mono text-[#06B6D4] mb-1 flex items-center justify-between uppercase">
          <span>{mode === 'pro' ? 'EXECUTIVE THESIS SYNTHESIS' : 'COMPANY OVERVIEW IN PLAIN ENGLISH'}</span>
          <span className="text-[9px] text-slate-400">Confidence Score: {synthesis.confidenceScore}%</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
          {displaySummary}
        </p>
      </div>

      {/* Dual Card Split: Bullish Drivers (Green) vs Bearish Risks (Red) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Bullish Drivers */}
        <div className="rounded-lg border border-[#10B981]/30 bg-[#0F172A]/70 p-3 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1 text-[#10B981]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider">
                {mode === 'pro' ? 'BULLISH DRIVERS & CATALYSTS' : 'WHY BUY? (GROWTH ENGINES)'}
              </h4>
            </div>
            <span className="rounded bg-slate-900 border border-slate-700 px-1.5 py-0.2 text-[9px] font-mono text-[#10B981]">
              {synthesis.bullishDrivers.length} Factors
            </span>
          </div>

          <div className="space-y-2">
            {synthesis.bullishDrivers.map((item, idx) => (
              <div key={idx} className="rounded bg-slate-900/60 p-2 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="font-bold text-white flex items-center">
                    <ArrowUpRight className="h-3 w-3 text-[#10B981] mr-1" />
                    {item.title}
                  </span>
                  <span className="text-[9px] font-mono font-semibold text-[#10B981] bg-[#10B981]/10 px-1 rounded border border-[#10B981]/30">
                    +{item.impactScore.toFixed(1)}/10
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                  {mode === 'pro' ? item.explanation : (item.studentExplanation || item.eli5Explanation || item.explanation)}
                </p>
                <div className="mt-0.5 text-[9px] text-slate-500 font-mono">
                  Time Horizon: {item.horizon}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bearish Risks */}
        <div className="rounded-lg border border-[#EF4444]/30 bg-[#0F172A]/70 p-3 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1 text-[#EF4444]">
              <ShieldAlert className="h-3.5 w-3.5" />
              <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider">
                {mode === 'pro' ? 'BEARISH RISKS & HEADWINDS' : 'WHAT COULD GO WRONG? (RISKS)'}
              </h4>
            </div>
            <span className="rounded bg-slate-900 border border-slate-700 px-1.5 py-0.2 text-[9px] font-mono text-[#EF4444]">
              {synthesis.bearishRisks.length} Risks
            </span>
          </div>

          <div className="space-y-2">
            {synthesis.bearishRisks.map((item, idx) => (
              <div key={idx} className="rounded bg-slate-900/60 p-2 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="font-bold text-white flex items-center">
                    <ArrowDownRight className="h-3 w-3 text-[#EF4444] mr-1" />
                    {item.title}
                  </span>
                  <span className="text-[9px] font-mono font-semibold text-[#EF4444] bg-[#EF4444]/10 px-1 rounded border border-[#EF4444]/30">
                    -{item.impactScore.toFixed(1)}/10
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                  {mode === 'pro' ? item.explanation : (item.studentExplanation || item.eli5Explanation || item.explanation)}
                </p>
                <div className="mt-0.5 text-[9px] text-slate-500 font-mono">
                  Time Horizon: {item.horizon}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Catalysts to Watch */}
      <div className="rounded-lg border border-slate-700/80 bg-[#0F172A]/70 p-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-slate-200 mb-2 uppercase">
          <Calendar className="h-3.5 w-3.5 text-[#06B6D4]" />
          <span>KEY UPCOMING CATALYSTS TO WATCH</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {synthesis.keyCatalysts.map((cat, idx) => (
            <div key={idx} className="rounded border border-slate-700/60 bg-slate-900/60 p-2 text-[10px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] mb-0.5">
                  <span className="text-[#06B6D4] font-mono flex items-center font-semibold">
                    <Clock className="h-2.5 w-2.5 mr-1" />
                    {cat.timeframe}
                  </span>
                  <span className={`text-[8px] px-1 rounded font-mono font-bold uppercase ${
                    cat.bias === 'Bullish' ? 'text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30' : 'text-slate-300 bg-slate-800'
                  }`}>
                    {cat.bias}
                  </span>
                </div>
                <div className="font-bold text-white line-clamp-1">{cat.event}</div>
                <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-2 font-sans">{cat.detail}</p>
              </div>
              <div className="mt-1.5 pt-1 border-t border-slate-800 text-[9px] text-slate-500 font-mono">
                Impact: {cat.expectedImpact}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Bull/Bear Weight Sliders (Quant Bridge) */}
      <div className="rounded-lg border border-slate-700/80 bg-[#0F172A]/70 p-3 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-[#06B6D4]" />
            <h4 className="text-[10px] font-bold text-slate-200 font-mono uppercase">
              {mode === 'pro'
                ? 'DYNAMIC QUALITATIVE-TO-DRIFT WEIGHT BRIDGE'
                : 'ADJUST YOUR BULL VS BEAR CONVICTION'}
            </h4>
          </div>
          <div className="text-[10px] font-mono font-bold text-[#06B6D4]">
            Simulated Drift Shift: <span className={Number(netShiftPercent) >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}>
              {Number(netShiftPercent) >= 0 ? '+' : ''}{netShiftPercent}%
            </span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 font-sans leading-tight">
          {mode === 'pro'
            ? 'Adjust subjective conviction weights to continuously modulate stochastic drift coefficient μ in live Monte Carlo.'
            : 'Slide these bars if you believe the catalysts or the risks are more powerful. The simulation updates automatically!'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Bull Weight Slider */}
          <div className="space-y-1 bg-slate-900/60 p-2.5 rounded border border-slate-800">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[#10B981] font-semibold">Bull Confidence:</span>
              <span className="text-[#10B981] font-bold">{bullWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={bullWeight}
              onChange={e => onChangeBullWeight(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-[#10B981]"
            />
          </div>

          {/* Bear Weight Slider */}
          <div className="space-y-1 bg-slate-900/60 p-2.5 rounded border border-slate-800">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[#EF4444] font-semibold">Bear Skepticism:</span>
              <span className="text-[#EF4444] font-bold">{bearWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={bearWeight}
              onChange={e => onChangeBearWeight(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-[#EF4444]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

