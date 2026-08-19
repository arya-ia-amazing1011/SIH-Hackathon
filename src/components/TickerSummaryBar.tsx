import React, { useMemo } from 'react';
import { StockTicker, Mode } from '../types';
import { TrendingUp, TrendingDown, Info, Layers, DollarSign, Activity, Clock, ShieldCheck } from 'lucide-react';
import { getMarketStatus } from '../utils/marketHours';

interface TickerSummaryBarProps {
  ticker: StockTicker;
  mode: Mode;
}

export const TickerSummaryBar: React.FC<TickerSummaryBarProps> = ({ ticker, mode }) => {
  const isPositive = ticker.change >= 0;
  const rangeSpan = ticker.high52 - ticker.low52;
  const currentPosPercent = rangeSpan > 0 ? Math.min(100, Math.max(0, ((ticker.price - ticker.low52) / rangeSpan) * 100)) : 50;

  // Compute live market status for this ticker
  const marketStatus = useMemo(() => getMarketStatus(ticker), [ticker]);

  return (
    <div className="rounded-xl border border-slate-700/70 bg-[#1E293B] p-3.5 sm:p-4 shadow-lg text-slate-200 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        {/* Symbol & Name & Live Price */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight">
                {ticker.symbol}
              </h1>
              <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-[#06B6D4] font-mono">
                {ticker.exchange}
              </span>
              <span className="rounded border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                {ticker.sector}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">{ticker.name}</p>
          </div>

          <div className="flex items-baseline gap-2.5 border-l border-slate-700 pl-3 sm:pl-4">
            <span className="text-xl sm:text-2xl font-bold font-mono text-white">
              {ticker.currency === 'INR' ? '₹' : '$'}
              {ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className={`flex items-center gap-1 text-xs sm:text-sm font-semibold font-mono ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              <span>
                {isPositive ? '+' : ''}{ticker.change.toFixed(2)} ({isPositive ? '+' : ''}{ticker.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Real-time Market Exchange Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-lg border shadow-sm ${marketStatus.badgeBg} ${marketStatus.badgeBorder} ${marketStatus.badgeColor}`}
            title={marketStatus.detail}
          >
            <span className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
            <span className="font-bold text-[11px]">{marketStatus.label}</span>
          </div>
        </div>

        {/* Institutional Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-5 text-xs font-mono">
          {/* 52-Week Range Bar */}
          <div className="flex flex-col justify-center">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>{mode === 'pro' ? '52W L' : 'Low'}: {ticker.currency === 'INR' ? '₹' : '$'}{ticker.low52.toFixed(1)}</span>
              <span>{mode === 'pro' ? '52W H' : 'High'}: {ticker.currency === 'INR' ? '₹' : '$'}{ticker.high52.toFixed(1)}</span>
            </div>
            <div className="relative h-1.5 w-32 sm:w-40 rounded-full bg-slate-900 overflow-hidden border border-slate-700">
              <div
                className="absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r from-[#EF4444] via-amber-400 to-[#10B981]"
                style={{ width: '100%' }}
              />
              <div
                className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-md -ml-1"
                style={{ left: `${currentPosPercent}%` }}
                title={`Position: ${currentPosPercent.toFixed(0)}%`}
              />
            </div>
          </div>

          {/* Beta */}
          <div className="border-l border-slate-700/80 pl-3">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Activity className="h-3 w-3 text-[#06B6D4]" />
              <span>{mode === 'pro' ? 'BETA (BMK)' : 'SENSITIVITY'}</span>
            </div>
            <div className="font-bold text-white mt-0.5">
              {ticker.beta.toFixed(2)}x
              <span className="ml-1 text-[9px] font-normal text-slate-400">
                {ticker.beta > 1.5 ? 'High Vol' : ticker.beta < 0.9 ? 'Defensive' : 'Market'}
              </span>
            </div>
          </div>

          {/* Market Cap */}
          <div className="border-l border-slate-700/80 pl-3">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-[#10B981]" />
              <span>{mode === 'pro' ? 'MARKET CAP' : 'SIZE'}</span>
            </div>
            <div className="font-bold text-white mt-0.5">
              {ticker.marketCap}
            </div>
          </div>

          {/* P/E Ratio */}
          <div className="border-l border-slate-700/80 pl-3">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="h-3 w-3 text-amber-400" />
              <span>{mode === 'pro' ? 'TRAIL P/E' : 'VALUATION'}</span>
            </div>
            <div className="font-bold text-white mt-0.5">
              {ticker.peRatio > 0 ? `${ticker.peRatio.toFixed(1)}x` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Detail & Mode Narrative Description */}
      <div className="pt-2.5 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-[#06B6D4] shrink-0 mt-0.5" />
          <p className="leading-relaxed font-sans text-[11px] sm:text-xs">
            <span className="font-bold text-[#06B6D4] font-mono">
              {mode === 'pro' ? 'ASSET PROFILE: ' : 'QUICK SUMMARY: '}
            </span>
            {mode === 'pro' ? ticker.description : ticker.eli5Description}
          </p>
        </div>

        <div className="text-[10px] font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-800 shrink-0">
          <span className="text-slate-500">EXCHANGE TIME: </span>
          <span className="text-slate-300">{marketStatus.session}</span>
        </div>
      </div>
    </div>
  );
};

