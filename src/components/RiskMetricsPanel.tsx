import React from 'react';
import { MonteCarloResults, Mode, TimeHorizon } from '../types';
import { ShieldAlert, TrendingUp, Percent, Award, HelpCircle } from 'lucide-react';

interface RiskMetricsPanelProps {
  results: MonteCarloResults;
  currency: string;
  horizonDays: TimeHorizon;
  mode: Mode;
}

export const RiskMetricsPanel: React.FC<RiskMetricsPanelProps> = ({
  results,
  currency,
  horizonDays,
  mode,
}) => {
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const expectedGain = results.medianFinalPrice - results.currentPrice;
  const expectedGainPercent = (expectedGain / results.currentPrice) * 100;
  const isGainPositive = expectedGain >= 0;

  return (
    <div className="rounded-xl border border-slate-700/70 bg-[#1E293B] p-3.5 sm:p-4 shadow-xl">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/60">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#06B6D4] font-mono">
            {mode === 'pro'
              ? 'RISK & RETURN PROFILE'
              : 'STUDENT DASHBOARD: PROFIT & RISK CHECK'}
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          Horizon: <span className="text-[#06B6D4] font-bold">{horizonDays}D</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        {/* 1. Value at Risk (VaR 95%) */}
        <div className="group rounded-lg border border-slate-700/80 bg-[#0F172A]/70 p-3 hover:border-[#EF4444]/60 transition">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            <span className="font-bold text-slate-300">
              {mode === 'pro' ? 'VaR (95% CI)' : 'Max Loss (95% Safety)'}
            </span>
            <HelpCircle className="h-3 w-3 text-slate-500 group-hover:text-[#EF4444]" />
          </div>

          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-[#EF4444]">
              -{results.var95Percent.toFixed(1)}%
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              (-{currencySymbol}{results.var95Dollar.toFixed(1)})
            </span>
          </div>

          <p className="mt-1.5 text-[10px] text-slate-400 leading-snug border-t border-slate-800 pt-1.5">
            {mode === 'pro'
              ? `Tail cutoff = ${currencySymbol}${results.p5FinalPrice.toFixed(2)}.`
              : `In 95 out of 100 cases, losses stay below ${currencySymbol}${results.var95Dollar.toFixed(0)}.`}
          </p>
        </div>

        {/* 2. Median Expected Target Price & ROI */}
        <div className="group rounded-lg border border-slate-700/80 bg-[#0F172A]/70 p-3 hover:border-[#06B6D4]/60 transition">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            <span className="font-bold text-slate-300">
              {mode === 'pro' ? 'Median Target' : 'Expected Target'}
            </span>
            <TrendingUp className="h-3 w-3 text-[#06B6D4]" />
          </div>

          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-white">
              {currencySymbol}{results.medianFinalPrice.toFixed(2)}
            </span>
            <span className={`text-[10px] font-mono font-bold ${isGainPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {isGainPositive ? '+' : ''}{expectedGainPercent.toFixed(1)}%
            </span>
          </div>

          <p className="mt-1.5 text-[10px] text-slate-400 leading-snug border-t border-slate-800 pt-1.5">
            {mode === 'pro'
              ? `Mean = ${currencySymbol}${results.meanFinalPrice.toFixed(2)}.`
              : `Expected middle price by Day ${horizonDays}.`}
          </p>
        </div>

        {/* 3. Probability of Positive Return */}
        <div className="group rounded-lg border border-slate-700/80 bg-[#0F172A]/70 p-3 hover:border-[#10B981]/60 transition">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            <span className="font-bold text-slate-300">
              {mode === 'pro' ? 'Win Probability' : 'Profit Chance'}
            </span>
            <Percent className="h-3 w-3 text-[#10B981]" />
          </div>

          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-xl font-bold font-mono text-[#10B981]">
              {results.probabilityOfProfit.toFixed(1)}%
            </span>

            {/* mini indicator */}
            <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <div
                className={`h-full ${
                  results.probabilityOfProfit >= 60
                    ? 'bg-[#10B981]'
                    : results.probabilityOfProfit >= 45
                    ? 'bg-amber-500'
                    : 'bg-[#EF4444]'
                }`}
                style={{ width: `${results.probabilityOfProfit}%` }}
              />
            </div>
          </div>

          <p className="mt-1.5 text-[10px] text-slate-400 leading-snug border-t border-slate-800 pt-1.5">
            {mode === 'pro'
              ? `${results.probabilityOfProfit.toFixed(0)}% paths finish above spot.`
              : `${results.probabilityOfProfit.toFixed(0)} of 100 paths finish with positive gains.`}
          </p>
        </div>

        {/* 4. Sharpe Ratio */}
        <div className="group rounded-lg border border-slate-700/80 bg-[#0F172A]/70 p-3 hover:border-indigo-500/60 transition">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            <span className="font-bold text-slate-300">
              {mode === 'pro' ? 'Sharpe (Ann.)' : 'Risk/Reward Score'}
            </span>
            <Award className="h-3 w-3 text-indigo-400" />
          </div>

          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className={`text-xl font-bold font-mono ${
              results.sharpeRatio > 1.0 ? 'text-[#10B981]' : results.sharpeRatio > 0.4 ? 'text-[#06B6D4]' : 'text-amber-400'
            }`}>
              {results.sharpeRatio.toFixed(2)}
            </span>
            <span className="text-[9px] font-mono uppercase text-slate-400">
              {results.sharpeRatio >= 1.2 ? 'Superior' : results.sharpeRatio >= 0.7 ? 'Solid' : 'Moderate'}
            </span>
          </div>

          <p className="mt-1.5 text-[10px] text-slate-400 leading-snug border-t border-slate-800 pt-1.5">
            {mode === 'pro'
              ? `Max DD: ${results.maxExpectedDrawdownPercent.toFixed(1)}%.`
              : `Higher score means you get more return for each unit of risk.`}
          </p>
        </div>
      </div>

      {/* Secondary Institutional Risk Breakdown (CVaR & Drawdown) */}
      <div className="mt-3 pt-2.5 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
        <div className="flex justify-between bg-[#0F172A]/50 px-2.5 py-1.5 rounded border border-slate-700/60">
          <span className="text-slate-400">{mode === 'pro' ? 'CVaR 95%' : 'Tail Average'}:</span>
          <span className="font-bold text-[#EF4444]">-{results.cvar95Percent.toFixed(1)}%</span>
        </div>

        <div className="flex justify-between bg-[#0F172A]/50 px-2.5 py-1.5 rounded border border-slate-700/60">
          <span className="text-slate-400">{mode === 'pro' ? 'VaR 99%' : 'Extreme Drop'}:</span>
          <span className="font-bold text-[#EF4444]">-{results.var99Percent.toFixed(1)}%</span>
        </div>

        <div className="flex justify-between bg-[#0F172A]/50 px-2.5 py-1.5 rounded border border-slate-700/60">
          <span className="text-slate-400">{mode === 'pro' ? 'Max DD' : 'Max Dip'}:</span>
          <span className="font-bold text-amber-400">{results.maxExpectedDrawdownPercent.toFixed(1)}%</span>
        </div>

        <div className="flex justify-between bg-[#0F172A]/50 px-2.5 py-1.5 rounded border border-slate-700/60">
          <span className="text-slate-400">{mode === 'pro' ? 'Win/Loss' : 'Gain/Loss Ratio'}:</span>
          <span className="font-bold text-[#10B981]">{results.expectedGainLossRatio.toFixed(2)}x</span>
        </div>
      </div>
    </div>
  );
};

