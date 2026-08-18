import React, { useState } from 'react';
import { MacroScenario, StockTicker, Mode } from '../types';
import { MACRO_SCENARIOS } from '../data/mockTickers';
import { evaluateMacroScenarioImpact } from '../services/geminiService';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  History,
  Scale,
  Zap,
  Users,
  Sliders,
  HelpCircle
} from 'lucide-react';

interface MacroStressTesterProps {
  ticker: StockTicker;
  activeScenario: MacroScenario | null;
  onApplyScenarioShift: (driftShift: number, volShift: number, scenario: MacroScenario) => void;
  onClearScenario: () => void;
  mode: Mode;
}

export const MacroStressTester: React.FC<MacroStressTesterProps> = ({
  ticker,
  activeScenario,
  onApplyScenarioShift,
  onClearScenario,
  mode,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(activeScenario?.id || 'earnings-beat');
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastCalculatedShift, setLastCalculatedShift] = useState<{
    driftShift: number;
    volShift: number;
    reasoning: string;
    eli5Reasoning: string;
    historicalPrecedent: string;
  } | null>(null);

  const currentScenario = MACRO_SCENARIOS.find(s => s.id === selectedScenarioId) || MACRO_SCENARIOS[0];

  const handleSelectScenario = async (scenario: MacroScenario) => {
    setSelectedScenarioId(scenario.id);
    if (scenario.id === 'custom') return;

    setIsLoading(true);
    try {
      const result = await evaluateMacroScenarioImpact(
        scenario.title,
        scenario.description,
        ticker
      );
      setLastCalculatedShift(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteCustomScenario = async (titleToRun: string, descToRun?: string) => {
    const title = titleToRun || customTitle;
    const desc = descToRun || customDesc || 'User defined performance shock or point drop.';
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      const result = await evaluateMacroScenarioImpact(title, desc, ticker);
      setLastCalculatedShift(result);
      setSelectedScenarioId('custom');
      setCustomTitle(title);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyShift = () => {
    if (!lastCalculatedShift && currentScenario) {
      onApplyScenarioShift(currentScenario.defaultDriftShift, currentScenario.defaultVolShift, currentScenario);
      return;
    }

    if (lastCalculatedShift) {
      const scenarioToApply: MacroScenario = {
        id: selectedScenarioId,
        title: selectedScenarioId === 'custom' ? (customTitle || 'Custom Stress Event') : currentScenario.title,
        category: currentScenario.category,
        description: lastCalculatedShift.reasoning,
        eli5Description: lastCalculatedShift.eli5Reasoning,
        defaultDriftShift: lastCalculatedShift.driftShift,
        defaultVolShift: lastCalculatedShift.volShift,
        probability: 'Medium',
        historicalAnalogy: lastCalculatedShift.historicalPrecedent,
      };
      onApplyScenarioShift(lastCalculatedShift.driftShift, lastCalculatedShift.volShift, scenarioToApply);
    }
  };

  const getScenarioIcon = (category: string) => {
    switch (category) {
      case 'earnings_beat':
        return <TrendingUp className="h-3.5 w-3.5 text-[#10B981]" />;
      case 'points_drop':
        return <TrendingDown className="h-3.5 w-3.5 text-[#EF4444]" />;
      case 'tech_breakthrough':
        return <Zap className="h-3.5 w-3.5 text-[#06B6D4]" />;
      case 'customer_shock':
        return <Users className="h-3.5 w-3.5 text-amber-400" />;
      case 'regulatory':
        return <Scale className="h-3.5 w-3.5 text-purple-400" />;
      default:
        return <Sliders className="h-3.5 w-3.5 text-indigo-400" />;
    }
  };

  // Pre-calculate shift on mount if not calculated yet
  React.useEffect(() => {
    if (!lastCalculatedShift) {
      handleSelectScenario(currentScenario);
    }
  }, [ticker.symbol]);

  const activeDriftShift = lastCalculatedShift?.driftShift ?? currentScenario.defaultDriftShift;
  const activeVolShift = lastCalculatedShift?.volShift ?? currentScenario.defaultVolShift;
  const effectiveDriftPct = ((ticker.drift + activeDriftShift) * 100).toFixed(1);
  const effectiveVolPct = (Math.max(0.05, ticker.volatility + activeVolShift) * 100).toFixed(1);
  const currencySymbol = ticker.currency === 'INR' ? '₹' : '$';

  return (
    <div className="rounded-xl border border-slate-700/70 bg-[#1E293B] p-3.5 sm:p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-slate-700/60">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#06B6D4]" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#06B6D4] font-mono">
              {mode === 'pro'
                ? 'CATALYST & PERFORMANCE STRESS-TESTING (FACTOR SHOCK ENGINE)'
                : 'WHAT-IF STOCK SHOCKS & SCENARIOS'}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
            {mode === 'pro'
              ? 'Quantify how company earnings beats, sudden point drops, and product catalysts alter drift (Δμ), volatility (Δσ), and simulated price distributions.'
              : 'Test what happens if the company beats earnings, suddenly drops in price, or faces big news.'}
          </p>
        </div>

        {activeScenario && (
          <button
            onClick={onClearScenario}
            className="text-[10px] font-mono text-[#EF4444] hover:text-white border border-[#EF4444]/40 bg-[#EF4444]/10 px-2 py-0.5 rounded transition"
          >
            Clear Active Shock
          </button>
        )}
      </div>

      {/* Quick Point-Drop & Earnings Beat Presets */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
        <span className="text-slate-400 font-bold uppercase mr-1">QUICK SHOCK PRESETS:</span>
        <button
          onClick={() => handleExecuteCustomScenario('Company Performs Better Than Expected (EPS Beat +25%)', 'Quarterly sales and gross margin beat expectations.')}
          className="rounded bg-emerald-950/40 border border-emerald-600/40 px-2 py-0.5 text-emerald-400 hover:bg-emerald-900/60 transition"
        >
          +25% Earnings Beat
        </button>
        <button
          onClick={() => handleExecuteCustomScenario(`Company Dropped 15 Points on Guidance Miss`, `Asset experiences an intraday selloff of 15 points.`)}
          className="rounded bg-rose-950/40 border border-rose-600/40 px-2 py-0.5 text-rose-400 hover:bg-rose-900/60 transition"
        >
          -15 Pts Flash Drop
        </button>
        <button
          onClick={() => handleExecuteCustomScenario(`Company Dropped 30 Points Flash Drawdown`, `Sudden institutional de-risking causes a 30 point plunge.`)}
          className="rounded bg-rose-950/40 border border-rose-600/40 px-2 py-0.5 text-rose-400 hover:bg-rose-900/60 transition"
        >
          -30 Pts Sudden Plunge
        </button>
        <button
          onClick={() => handleExecuteCustomScenario('Major Product Breakthrough & AI Compute Demand Wave', 'Next-generation architecture demand accelerates 3x.')}
          className="rounded bg-cyan-950/40 border border-cyan-600/40 px-2 py-0.5 text-cyan-400 hover:bg-cyan-900/60 transition"
        >
          AI Product Breakthrough
        </button>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-3 font-mono">
        {MACRO_SCENARIOS.map(s => {
          const isSelected = selectedScenarioId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleSelectScenario(s)}
              className={`flex flex-col text-left p-2.5 rounded-lg border transition ${
                isSelected
                  ? 'bg-slate-800 border-[#06B6D4] shadow-sm ring-1 ring-[#06B6D4]/50'
                  : 'bg-[#0F172A]/70 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                {getScenarioIcon(s.category)}
                {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-[#06B6D4]" />}
              </div>
              <span className="text-[11px] font-bold text-white line-clamp-1">{s.title}</span>
              <span className="text-[9px] text-slate-400 mt-0.5 line-clamp-2 font-sans">
                {mode === 'pro' ? s.historicalAnalogy : s.studentDescription}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Scenario Form if selected */}
      {selectedScenarioId === 'custom' && (
        <form onSubmit={(e) => { e.preventDefault(); handleExecuteCustomScenario(customTitle, customDesc); }} className="mt-3 p-3 rounded-lg border border-purple-900/50 bg-purple-950/20 space-y-2 font-mono">
          <div className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-purple-400" />
            <span>CUSTOM PERFORMANCE CATALYST / POINT DROP SIMULATOR</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder='e.g. "Dropped 20 points after CFO departure" or "Beats Q3 sales by 30%"'
              value={customTitle}
              onChange={e => setCustomTitle(e.target.value)}
              className="rounded border border-slate-700 bg-[#0F172A] px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-[#06B6D4] focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="Additional catalyst or supply chain details (optional)..."
              value={customDesc}
              onChange={e => setCustomDesc(e.target.value)}
              className="rounded border border-slate-700 bg-[#0F172A] px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-[#06B6D4] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !customTitle.trim()}
            className="rounded bg-purple-600 px-3 py-1 text-xs font-bold text-white hover:bg-purple-500 transition disabled:opacity-50"
          >
            {isLoading ? 'Calculating Shock via Gemini...' : 'Calculate Quantitative Shock'}
          </button>
        </form>
      )}

      {/* WHAT CHANGES: Explicit Comparative Breakdown Card */}
      <div className="mt-3 rounded-lg border border-slate-700/80 bg-[#0F172A]/85 p-3 font-mono">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#06B6D4] uppercase border-b border-slate-700/60 pb-1.5 mb-2.5">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>WHAT CHANGES WHEN THIS SHOCK OCCURS?</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs mb-3">
          {/* 1. Drift Shift */}
          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">EXPECTED DRIFT (μ)</div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-slate-400 text-xs">{(ticker.drift * 100).toFixed(1)}% base</span>
              <span className="text-slate-500">→</span>
              <span className={`text-base font-bold ${activeDriftShift >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {effectiveDriftPct}% ({activeDriftShift >= 0 ? '+' : ''}{(activeDriftShift * 100).toFixed(1)}%)
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1 font-sans">
              {activeDriftShift >= 0 ? 'Upward trajectory expansion & higher expected value.' : 'Downward multiple drag on baseline expected return.'}
            </p>
          </div>

          {/* 2. Volatility Shift */}
          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">ANNUALIZED VOLATILITY (σ)</div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-slate-400 text-xs">{(ticker.volatility * 100).toFixed(1)}% base</span>
              <span className="text-slate-500">→</span>
              <span className={`text-base font-bold ${activeVolShift >= 0 ? 'text-amber-400' : 'text-[#06B6D4]'}`}>
                {effectiveVolPct}% ({activeVolShift >= 0 ? '+' : ''}{(activeVolShift * 100).toFixed(1)}%)
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1 font-sans">
              {activeVolShift >= 0 ? 'Wider confidence bounds & higher short-term dispersion.' : 'Vol compression as market uncertainty resolves.'}
            </p>
          </div>

          {/* 3. Valuation & Tail Risk */}
          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">RISK PROFILE & VaR</div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xs text-slate-300">Spot: {currencySymbol}{ticker.price.toFixed(2)}</span>
              <span className={`text-xs font-bold ${activeDriftShift >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {activeDriftShift >= 0 ? 'Upside Expanded' : 'Downside VaR +'}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1 font-sans">
              {activeDriftShift >= 0
                ? 'Probability of profit increases and lower tail risk diminishes.'
                : 'Maximum expected drawdown and 95% Value-at-Risk expand.'}
            </p>
          </div>
        </div>

        {/* Narrative Reasoning & Precedent */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {selectedScenarioId === 'custom' && customTitle ? customTitle : currentScenario.title}
              </span>
              <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.2 text-[9px] text-[#06B6D4]">
                Asset: {ticker.symbol} (β {ticker.beta.toFixed(2)}x)
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              {mode === 'pro'
                ? lastCalculatedShift?.reasoning || currentScenario.description
                : lastCalculatedShift?.eli5Reasoning || currentScenario.studentDescription}
            </p>

            {lastCalculatedShift?.historicalPrecedent && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
                <History className="h-3 w-3 text-[#06B6D4]" />
                <span>Historical Precedent: <strong className="text-slate-200">{lastCalculatedShift.historicalPrecedent}</strong></span>
              </div>
            )}
          </div>

          {/* Action Apply Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleApplyShift}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded bg-[#06B6D4] px-4 py-2.5 text-xs font-bold text-[#0F172A] hover:bg-[#22D3EE] transition shadow-md shadow-[#06B6D4]/20 active:scale-95 disabled:opacity-50"
            >
              <span>{activeScenario?.id === selectedScenarioId ? 'APPLIED TO SIMULATOR' : 'APPLY STRESS SHIFT TO SIMULATOR'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
