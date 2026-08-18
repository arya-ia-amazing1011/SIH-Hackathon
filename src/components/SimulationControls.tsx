import React from 'react';
import { Mode } from '../types';
import { Sliders, Activity, TrendingUp } from 'lucide-react';

interface SimulationControlsProps {
  volatility: number;
  drift: number;
  qualitativeDriftShift: number;
  onChangeVolatility: (vol: number) => void;
  onChangeDrift: (drift: number) => void;
  onResetParams: () => void;
  mode: Mode;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  volatility,
  drift,
  qualitativeDriftShift,
  onChangeVolatility,
  onChangeDrift,
  onResetParams,
  mode,
}) => {
  const volPercent = Math.round(volatility * 100);
  const driftPercent = Math.round(drift * 100);
  const totalEffectiveDriftPercent = Math.round((drift + qualitativeDriftShift) * 100);

  const volPresets = [
    { label: 'Low (15%)', val: 0.15 },
    { label: 'Norm (30%)', val: 0.30 },
    { label: 'High (50%)', val: 0.50 },
    { label: 'Crypto (85%)', val: 0.85 },
  ];

  const driftPresets = [
    { label: 'Bear (-20%)', val: -0.20 },
    { label: 'Flat (0%)', val: 0.00 },
    { label: 'Avg (+12%)', val: 0.12 },
    { label: 'Rally (+35%)', val: 0.35 },
  ];

  return (
    <div className="rounded-xl border border-slate-700/70 bg-[#1E293B] p-3.5 sm:p-4 shadow-xl">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/60">
        <div className="flex items-center gap-1.5">
          <Sliders className="h-4 w-4 text-[#06B6D4]" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#06B6D4] font-mono">
            {mode === 'pro' ? 'PARAMETER TUNING (GBM)' : 'VOLATILITY & TREND SLIDERS'}
          </h3>
        </div>
        <button
          onClick={onResetParams}
          className="text-[10px] text-slate-400 hover:text-[#06B6D4] transition font-mono"
        >
          Reset Baseline
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-3">
        {/* Annual Volatility Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1 font-mono uppercase text-[10px]">
              <Activity className="h-3 w-3 text-amber-400" />
              <span>{mode === 'pro' ? 'Annualized Volatility (σ)' : 'Price Swings (Volatility)'}</span>
            </label>
            <span className="font-mono text-sm font-bold text-amber-400">
              {volPercent}%
            </span>
          </div>

          <input
            type="range"
            min="5"
            max="120"
            step="1"
            value={volPercent}
            onChange={e => onChangeVolatility(Number(e.target.value) / 100)}
            className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-amber-400"
          />

          {/* Quick Vol Presets */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {volPresets.map(p => (
              <button
                key={p.label}
                onClick={() => onChangeVolatility(p.val)}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition ${
                  Math.abs(volatility - p.val) < 0.03
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold'
                    : 'bg-[#0F172A] border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {mode === 'pro'
              ? 'Controls diffusion amplitude dW. Higher σ widens terminal distribution tails.'
              : 'Higher volatility means wider swings and more risk.'}
          </p>
        </div>

        {/* Expected Drift Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1 font-mono uppercase text-[10px]">
              <TrendingUp className="h-3 w-3 text-[#06B6D4]" />
              <span>{mode === 'pro' ? 'Expected Drift (μ)' : 'Expected Trend (Drift)'}</span>
            </label>
            <div className="flex items-center gap-1.5">
              <span className={`font-mono text-sm font-bold ${driftPercent >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {driftPercent >= 0 ? '+' : ''}{driftPercent}%
              </span>
              {qualitativeDriftShift !== 0 && (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#06B6D4]/10 border border-[#06B6D4]/40 text-[#06B6D4]" title="Shift from qualitative catalyst weights">
                  {qualitativeDriftShift >= 0 ? '+' : ''}{(qualitativeDriftShift * 100).toFixed(1)}% AI
                </span>
              )}
            </div>
          </div>

          <input
            type="range"
            min="-50"
            max="80"
            step="1"
            value={driftPercent}
            onChange={e => onChangeDrift(Number(e.target.value) / 100)}
            className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-[#06B6D4]"
          />

          {/* Quick Drift Presets */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {driftPresets.map(p => (
              <button
                key={p.label}
                onClick={() => onChangeDrift(p.val)}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition ${
                  Math.abs(drift - p.val) < 0.03
                    ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#06B6D4] font-bold'
                    : 'bg-[#0F172A] border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 leading-tight">
            <span>
              {mode === 'pro'
                ? `Effective Total Drift = ${totalEffectiveDriftPercent >= 0 ? '+' : ''}${totalEffectiveDriftPercent}%`
                : `Net expected annual growth rate = ${totalEffectiveDriftPercent >= 0 ? '+' : ''}${totalEffectiveDriftPercent}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
