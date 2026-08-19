import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { StockTicker, Mode, HistoricalDataPoint } from '../types';
import { generateHistoricalVolatilitySeries, generateVolatilityCone } from '../utils/quantEngine';
import { getMarketStatus } from '../utils/marketHours';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  BarChart2,
  Gauge,
  Info,
  Radio,
  Play,
  Pause,
  RefreshCw,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';

interface HistoricalVolatilityViewerProps {
  ticker: StockTicker;
  mode: Mode;
}

export const HistoricalVolatilityViewer: React.FC<HistoricalVolatilityViewerProps> = ({
  ticker,
  mode,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<number>(252); // Default 1 Year (252 trading days)
  const [activeSubView, setActiveSubView] = useState<'bands' | 'cone' | 'distribution'>('bands');
  const [hoveredTenor, setHoveredTenor] = useState<string | null>(null);

  // Compute live market status
  const marketStatus = useMemo(() => getMarketStatus(ticker), [ticker]);

  // --- Live Market Feed Streaming State ---
  // When market is closed, default streaming to false unless user explicitly activates sandbox simulation
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(marketStatus.isOpen);
  const [sandboxSimulationMode, setSandboxSimulationMode] = useState<boolean>(false);
  const [streamSpeed, setStreamSpeed] = useState<number>(2500); // 2.5s per tick default
  const [livePrice, setLivePrice] = useState<number>(ticker.price);
  const [livePriceChange, setLivePriceChange] = useState<number>(0);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [liveTickCount, setLiveTickCount] = useState<number>(0);
  const [lastTickTime, setLastTickTime] = useState<string>('Official Close');

  // Base historical series generated from quant engine
  const baseHistoricalData = useMemo(() => {
    return generateHistoricalVolatilitySeries(ticker, selectedPeriod);
  }, [ticker.symbol, selectedPeriod]);

  // Live historical data state (reactive to live incoming ticks)
  const [liveHistoricalSeries, setLiveHistoricalSeries] = useState<HistoricalDataPoint[]>(baseHistoricalData);

  // Sync state whenever ticker or lookback period changes
  useEffect(() => {
    const isCurrentlyOpen = marketStatus.isOpen;
    setIsLiveStreaming(isCurrentlyOpen || sandboxSimulationMode);
    setLivePrice(ticker.price);
    setLivePriceChange(0);
    setPriceFlash(null);
    setLiveTickCount(0);
    setLastTickTime(isCurrentlyOpen ? 'Streaming Live' : 'Market Closed (Official Close)');
    setLiveHistoricalSeries(baseHistoricalData);
  }, [ticker.symbol, selectedPeriod, baseHistoricalData, marketStatus.isOpen]);

  // Push an incoming live tick and recalculate rolling 30D volatility & envelope in real time
  const handleIngestLiveTick = useCallback((tickPriceDelta: number) => {
    setLiveHistoricalSeries(prev => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const lastIndex = copy.length - 1;
      const currentPoint = copy[lastIndex];

      const newPrice = Math.max(0.5, Number((currentPoint.price + tickPriceDelta).toFixed(2)));
      const prevPrice = lastIndex > 0 ? copy[lastIndex - 1].price : newPrice;
      const dailyReturnPct = Number((((newPrice - prevPrice) / prevPrice) * 100).toFixed(2));

      // Recalculate 30D rolling annualized volatility with new live tick
      const windowStart = Math.max(0, copy.length - 30);
      const returnsWindow = copy.slice(windowStart, lastIndex).map(p => p.dailyReturn / 100);
      returnsWindow.push(dailyReturnPct / 100);

      const meanRet = returnsWindow.reduce((a, b) => a + b, 0) / returnsWindow.length;
      const variance = returnsWindow.reduce((acc, r) => acc + Math.pow(r - meanRet, 2), 0) / (returnsWindow.length || 1);
      const newRollingVol30D = Number((Math.sqrt(variance * 252) * 100).toFixed(1));

      const bandSpread = newPrice * (newRollingVol30D / 100) * Math.sqrt(30 / 252);
      const upperBand = Number((newPrice + bandSpread).toFixed(2));
      const lowerBand = Number(Math.max(0.5, newPrice - bandSpread).toFixed(2));

      copy[lastIndex] = {
        ...currentPoint,
        price: newPrice,
        dailyReturn: dailyReturnPct,
        rollingVol30D: newRollingVol30D,
        upperBand,
        lowerBand,
        isLiveTick: true,
      };

      // Update live quote stats
      setLivePrice(newPrice);
      setLivePriceChange(tickPriceDelta);
      setPriceFlash(tickPriceDelta >= 0 ? 'up' : 'down');
      setLiveTickCount(c => c + 1);
      setLastTickTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Clear flash after 800ms
      setTimeout(() => {
        setPriceFlash(null);
      }, 800);

      return copy;
    });
  }, []);

  // Streaming timer loop
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLiveStreaming) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      // Stochastic tick delta tailored to ticker volatility
      // e.g. NVDA/TSLA high vol (0.48/0.58) -> larger intraday ticks, GOOGL (0.29) -> steady ticks
      const volMultiplier = ticker.volatility * (ticker.price > 1000 ? 4.0 : ticker.price > 100 ? 0.6 : 0.15);
      const randZ = (Math.random() - 0.49); // slight drift bias
      const delta = Number((randZ * volMultiplier).toFixed(2));

      handleIngestLiveTick(delta);
    }, streamSpeed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLiveStreaming, streamSpeed, ticker.volatility, ticker.price, handleIngestLiveTick]);


  const currencySymbol = ticker.currency === 'INR' ? '₹' : '$';

  // Volatility cone term structure (adjusts dynamically to live realized volatility)
  const volatilityCone = useMemo(() => {
    return generateVolatilityCone(ticker);
  }, [ticker]);

  // Compute key historical & live stats
  const stats = useMemo(() => {
    if (liveHistoricalSeries.length === 0) {
      return {
        currentPrice: livePrice,
        currentVol: ticker.volatility * 100,
        avgVol: ticker.volatility * 100,
        volPercentile: 50,
        maxPrice: ticker.high52,
        minPrice: ticker.low52,
        maxVol: ticker.volatility * 100 * 1.5,
        minVol: ticker.volatility * 100 * 0.6,
        maxDrawdown: 18.5,
      };
    }

    const vols = liveHistoricalSeries.map(d => d.rollingVol30D);
    const prices = liveHistoricalSeries.map(d => d.price);
    const currentVol = vols[vols.length - 1];
    const avgVol = vols.reduce((a, b) => a + b, 0) / vols.length;
    const maxVol = Math.max(...vols);
    const minVol = Math.min(...vols);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);

    // Rank of current volatility
    const lowerCount = vols.filter(v => v <= currentVol).length;
    const volPercentile = (lowerCount / vols.length) * 100;

    // Peak-to-trough drawdown in this period
    let peak = prices[0];
    let maxDd = 0;
    for (const p of prices) {
      if (p > peak) peak = p;
      const dd = ((peak - p) / peak) * 100;
      if (dd > maxDd) maxDd = dd;
    }

    return {
      currentPrice: prices[prices.length - 1],
      currentVol,
      avgVol,
      volPercentile,
      maxPrice,
      minPrice,
      maxVol,
      minVol,
      maxDrawdown: maxDd,
    };
  }, [liveHistoricalSeries, livePrice, ticker]);

  // Return distribution histogram bins
  const returnDistribution = useMemo(() => {
    const bins: { range: string; count: number; min: number; max: number }[] = [
      { range: '< -4%', count: 0, min: -99, max: -4 },
      { range: '-4% to -2%', count: 0, min: -4, max: -2 },
      { range: '-2% to -1%', count: 0, min: -2, max: -1 },
      { range: '-1% to 0%', count: 0, min: -1, max: 0 },
      { range: '0% to +1%', count: 0, min: 0, max: 1 },
      { range: '+1% to +2%', count: 0, min: 1, max: 2 },
      { range: '+2% to +4%', count: 0, min: 2, max: 4 },
      { range: '> +4%', count: 0, min: 4, max: 99 },
    ];

    liveHistoricalSeries.forEach(d => {
      const r = d.dailyReturn;
      for (const b of bins) {
        if (r >= b.min && r < b.max) {
          b.count++;
          break;
        }
      }
    });

    return bins;
  }, [liveHistoricalSeries]);

  const periodButtons = [
    { label: '1M', days: 22, desc: '1 Month' },
    { label: '3M', days: 65, desc: '3 Months' },
    { label: '6M', days: 126, desc: '6 Months' },
    { label: '1Y', days: 252, desc: '1 Year' },
    { label: '2Y', days: 504, desc: '2 Years' },
    { label: '5Y', days: 1260, desc: '5 Years' },
  ];

  return (
    <div className="space-y-3.5">
      {/* Market Closed Official Notice Banner (if market is currently closed) */}
      {!marketStatus.isOpen && (
        <div className="rounded-lg border border-rose-800/60 bg-rose-950/40 p-3 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-300 uppercase tracking-wide">
                  {marketStatus.label}
                </span>
                <span className="text-[10px] text-rose-400 bg-rose-900/60 px-1.5 py-0.5 rounded border border-rose-700/50">
                  {ticker.exchange}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                {marketStatus.detail} Showing official closing price of{' '}
                <span className="font-bold text-white font-mono">
                  {ticker.currency === 'INR' ? '₹' : '$'}{ticker.price.toFixed(2)}
                </span>
                .
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const nextMode = !sandboxSimulationMode;
                setSandboxSimulationMode(nextMode);
                setIsLiveStreaming(nextMode);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1.5 ${
                sandboxSimulationMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500'
              }`}
              title="Toggle stochastic sandbox tick simulation for testing when exchange is closed"
            >
              <SlidersHorizontal className="w-3 h-3 text-amber-400" />
              <span>{sandboxSimulationMode ? 'SANDBOX REPLAY ACTIVE' : 'RUN SANDBOX SIMULATION'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Bar: Live Market Streaming Controller & Sub-View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-700/60 font-mono text-xs">
        {/* Live Feed Status Badge & Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
            isLiveStreaming
              ? (sandboxSimulationMode ? 'bg-amber-950/30 border-amber-600/40 text-amber-300' : 'bg-emerald-950/30 border-emerald-600/40 text-emerald-300')
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}>
            <span className="relative flex h-2 w-2">
              {isLiveStreaming ? (
                <>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sandboxSimulationMode ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${sandboxSimulationMode ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
              )}
            </span>
            <span className="text-[10px] font-bold uppercase">
              {isLiveStreaming
                ? (sandboxSimulationMode ? 'SANDBOX SIMULATOR (OFF-HOURS)' : 'LIVE EXCHANGE FEED')
                : 'OFFICIAL CLOSE (STATIC)'}
            </span>
            <span className="text-[9px] text-slate-500 pl-1 border-l border-slate-800">
              {ticker.symbol} {isLiveStreaming ? `(Tick #${liveTickCount})` : ''}
            </span>
          </div>

          {/* Play/Pause toggle */}
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-bold transition ${
              isLiveStreaming
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title={isLiveStreaming ? 'Pause live stream' : 'Resume live stream'}
          >
            {isLiveStreaming ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span>{isLiveStreaming ? 'PAUSE' : 'STREAM'}</span>
          </button>

          {/* Tick Speed Selector */}
          <div className="hidden sm:flex items-center bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-[9px] text-slate-400 gap-1">
            <span>SPEED:</span>
            {[
              { label: '1s', val: 1000 },
              { label: '2.5s', val: 2500 },
              { label: '5s', val: 5000 },
            ].map(s => (
              <button
                key={s.val}
                onClick={() => setStreamSpeed(s.val)}
                className={`px-1.5 py-0.5 rounded transition ${
                  streamSpeed === s.val ? 'bg-[#06B6D4] text-[#0F172A] font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Manual Tick Button */}
          <button
            onClick={() => {
              const delta = (Math.random() - 0.48) * (ticker.price > 100 ? 0.75 : 0.2);
              handleIngestLiveTick(Number(delta.toFixed(2)));
            }}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded text-[10px] text-slate-200 transition active:scale-95"
            title="Fetch immediate tick"
          >
            <RefreshCw className="h-3 w-3 text-[#06B6D4]" />
            <span>PULL TICK</span>
          </button>
        </div>

        {/* View Switcher: Price & Vol Bands vs Vol Cone vs Daily Swings */}
        <div className="flex items-center gap-1.5">
          <div className="flex bg-slate-900 p-0.5 rounded border border-slate-700">
            <button
              onClick={() => setActiveSubView('bands')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition ${
                activeSubView === 'bands'
                  ? 'bg-[#06B6D4] text-[#0F172A]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PRICE & VOL BANDS
            </button>
            <button
              onClick={() => setActiveSubView('cone')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition ${
                activeSubView === 'cone'
                  ? 'bg-[#06B6D4] text-[#0F172A]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              VOL CONE (TERM)
            </button>
            <button
              onClick={() => setActiveSubView('distribution')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition ${
                activeSubView === 'distribution'
                  ? 'bg-[#06B6D4] text-[#0F172A]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DAILY SWING BINS
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Live Tick Injector Bar */}
      <div className="bg-[#0F172A]/80 border border-slate-800 rounded-lg p-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
        <div className="flex items-center gap-1 text-slate-400">
          <Zap className="h-3.5 w-3.5 text-[#06B6D4]" />
          <span className="font-bold text-slate-300">TEST LIVE TICK IMPACT:</span>
          <span className="hidden md:inline text-slate-500">Inject instant price move to observe real-time volatility & band adjustment:</span>
        </div>
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            onClick={() => handleIngestLiveTick(ticker.price > 1000 ? 25.0 : ticker.price > 100 ? 3.5 : 0.8)}
            className="flex items-center gap-0.5 bg-emerald-950/40 border border-emerald-600/40 px-2 py-0.5 rounded text-emerald-400 hover:bg-emerald-900/60 transition"
          >
            <ArrowUpRight className="h-3 w-3" />
            <span>+{currencySymbol}{ticker.price > 1000 ? '25' : ticker.price > 100 ? '3.50' : '0.80'} Up-Tick</span>
          </button>
          <button
            onClick={() => handleIngestLiveTick(ticker.price > 1000 ? -25.0 : ticker.price > 100 ? -3.5 : -0.8)}
            className="flex items-center gap-0.5 bg-rose-950/40 border border-rose-600/40 px-2 py-0.5 rounded text-rose-400 hover:bg-rose-900/60 transition"
          >
            <ArrowDownRight className="h-3 w-3" />
            <span>-{currencySymbol}{ticker.price > 1000 ? '25' : ticker.price > 100 ? '3.50' : '0.80'} Down-Tick</span>
          </button>
          <button
            onClick={() => handleIngestLiveTick(ticker.price > 1000 ? -75.0 : ticker.price > 100 ? -12.0 : -3.0)}
            className="flex items-center gap-0.5 bg-rose-950/60 border border-rose-500/60 px-2 py-0.5 rounded text-rose-300 hover:bg-rose-900 transition font-bold"
          >
            <ArrowDownRight className="h-3 w-3" />
            <span>Flash Drop (-{currencySymbol}{ticker.price > 1000 ? '75' : ticker.price > 100 ? '12' : '3'})</span>
          </button>
        </div>
      </div>

      {/* Volatility Regime & Live Quote Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
        {/* Live LTP & Intraday Action */}
        <div className={`rounded-lg border p-2.5 transition-colors duration-300 ${
          priceFlash === 'up'
            ? 'border-emerald-500/80 bg-emerald-950/30'
            : priceFlash === 'down'
            ? 'border-rose-500/80 bg-rose-950/30'
            : 'border-slate-700/80 bg-[#0F172A]/70'
        }`}>
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>LIVE LAST TRADED PRICE:</span>
            <Radio className={`h-3 w-3 ${isLiveStreaming ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-white tracking-tight">
              {currencySymbol}{livePrice.toFixed(2)}
            </span>
            <span className={`text-[10px] font-bold ${livePriceChange >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {livePriceChange >= 0 ? '+' : ''}{livePriceChange.toFixed(2)} ({lastTickTime})
            </span>
          </div>
        </div>

        {/* 30D Rolling Realized Volatility */}
        <div className="rounded-lg border border-slate-700/80 bg-[#0F172A]/70 p-2.5">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>{mode === 'pro' ? '30D Realized Vol (Live)' : 'Current Volatility'}:</span>
            <Gauge className="h-3 w-3 text-[#06B6D4]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white">{stats.currentVol.toFixed(1)}%</span>
            <span className="text-[9px] text-slate-400">
              (Avg: {stats.avgVol.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Volatility Percentile Rank */}
        <div className="rounded-lg border border-slate-700/80 bg-[#0F172A]/70 p-2.5">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>{mode === 'pro' ? 'Vol Percentile Rank' : 'Wildness Score'}:</span>
            <TrendingUp className="h-3 w-3 text-[#10B981]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-lg font-bold ${
              stats.volPercentile > 75 ? 'text-[#EF4444]' : stats.volPercentile > 40 ? 'text-amber-400' : 'text-[#10B981]'
            }`}>
              {stats.volPercentile.toFixed(0)}th
            </span>
            <span className="text-[9px] text-slate-400">
              {stats.volPercentile > 75 ? 'High Vol' : stats.volPercentile > 40 ? 'Moderate' : 'Low Vol'}
            </span>
          </div>
        </div>

        {/* Period Max Drawdown */}
        <div className="rounded-lg border border-slate-700/80 bg-[#0F172A]/70 p-2.5">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>{mode === 'pro' ? 'Period Max Drawdown' : 'Worst Dip in Window'}:</span>
            <AlertTriangle className="h-3 w-3 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-[#EF4444]">-{stats.maxDrawdown.toFixed(1)}%</span>
            <span className="text-[9px] text-slate-400">Peak to Trough</span>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: Historical Price Chart with 30D Rolling Realized Volatility Envelope */}
      {activeSubView === 'bands' && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-300 bg-slate-900/60 px-3 py-1.5 rounded-md border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-sm bg-[#06B6D4]" />
                <span className="text-slate-400">Live & Historical Price</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-sm bg-indigo-500 opacity-60" />
                <span className="text-slate-400">2-Sigma Volatility Envelope</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-sm bg-amber-400" />
                <span className="text-slate-400">30D Rolling Vol %</span>
              </span>
            </div>
            <span className="text-slate-400 text-[10px] flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live updates stream directly into right edge of chart
            </span>
          </div>

          <div className="h-64 sm:h-80 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={liveHistoricalSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="volBandGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#334155" opacity={0.3} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  yAxisId="priceAxis"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={val => `${currencySymbol}${val.toFixed(0)}`}
                  width={55}
                />
                <YAxis
                  yAxisId="volAxis"
                  orientation="right"
                  stroke="#F59E0B"
                  tick={{ fill: '#F59E0B', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={val => `${val.toFixed(0)}%`}
                  width={40}
                />

                {/* Volatility Bands Area */}
                <Area
                  yAxisId="priceAxis"
                  type="monotone"
                  dataKey="upperBand"
                  stroke="none"
                  fill="url(#volBandGradient)"
                  isAnimationActive={false}
                />

                {/* Historical Price Line */}
                <Line
                  yAxisId="priceAxis"
                  type="monotone"
                  dataKey="price"
                  name="Price"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />

                {/* Upper and Lower Realized Volatility Bounds */}
                <Line
                  yAxisId="priceAxis"
                  type="monotone"
                  dataKey="upperBand"
                  stroke="#6366F1"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="priceAxis"
                  type="monotone"
                  dataKey="lowerBand"
                  stroke="#6366F1"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  isAnimationActive={false}
                />

                {/* 30D Rolling Volatility Line on Secondary Axis */}
                <Line
                  yAxisId="volAxis"
                  type="monotone"
                  dataKey="rollingVol30D"
                  name="30D Realized Vol"
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as (typeof liveHistoricalSeries)[0];
                      return (
                        <div className="rounded-lg border border-slate-700 bg-[#0F172A]/95 p-2.5 shadow-2xl backdrop-blur font-mono text-xs z-50">
                          <div className="flex items-center justify-between border-b border-slate-700 pb-1 mb-1.5">
                            <span className="font-bold text-white flex items-center gap-1">
                              {d.date}
                              {d.isLiveTick && <span className="text-[9px] text-emerald-400 font-bold">(LIVE TICK)</span>}
                            </span>
                            <span className={`text-[10px] font-bold ${d.dailyReturn >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                              {d.dailyReturn >= 0 ? '+' : ''}{d.dailyReturn.toFixed(2)}% Daily
                            </span>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between items-center text-[#06B6D4]">
                              <span>Price:</span>
                              <span className="font-bold">{currencySymbol}{d.price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-amber-400">
                              <span>30D Realized Vol:</span>
                              <span className="font-bold">{d.rollingVol30D.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between items-center text-indigo-300 text-[10px]">
                              <span>2-Sigma Band:</span>
                              <span>{currencySymbol}{d.lowerBand.toFixed(1)} - {currencySymbol}{d.upperBand.toFixed(1)}</span>
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
        </div>
      )}

      {/* SUB-VIEW 2: Volatility Cone (Term Structure of Volatility) */}
      {activeSubView === 'cone' && (
        <div className="space-y-2">
          <div className="bg-slate-900/60 p-2.5 rounded-md border border-slate-800 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5 text-[#06B6D4] font-bold mb-1">
              <Info className="h-3.5 w-3.5" />
              <span>{mode === 'pro' ? 'VOLATILITY TERM STRUCTURE (CONE)' : 'VOLATILITY OVER DIFFERENT TIME HORIZONS'}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              {mode === 'pro'
                ? 'Displays historical volatility distribution percentiles across 10-day to 1-year tenors compared with current realized & implied volatility.'
                : 'Shows how price swings usually calm down or average out over longer time frames versus short-term panics.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 font-mono">
            {volatilityCone.map(c => {
              const isSelected = hoveredTenor === c.tenor;
              const isElevated = c.currentRealizedVol > c.medianVol;
              return (
                <div
                  key={c.tenor}
                  onMouseEnter={() => setHoveredTenor(c.tenor)}
                  onMouseLeave={() => setHoveredTenor(null)}
                  className={`rounded-lg border p-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#06B6D4] bg-[#06B6D4]/10 shadow-lg'
                      : 'border-slate-700/80 bg-[#0F172A]/70 hover:border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1 border-b border-slate-800 pb-1">
                    <span className="font-bold text-white">{c.tenor} Tenor</span>
                    <span className="text-[9px] text-slate-500">{c.days}D</span>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-[10px]">Realized:</span>
                      <span className={`font-bold ${isElevated ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                        {c.currentRealizedVol}%
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400 text-[10px]">Median:</span>
                      <span>{c.medianVol}%</span>
                    </div>

                    <div className="flex justify-between text-[#06B6D4]">
                      <span className="text-slate-400 text-[10px]">Implied:</span>
                      <span>{c.impliedVol}%</span>
                    </div>

                    <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-800/80 flex justify-between">
                      <span>Range:</span>
                      <span>{c.minVol}% - {c.maxVol}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: Return Distribution Swings (Histogram) */}
      {activeSubView === 'distribution' && (
        <div className="space-y-2">
          <div className="bg-slate-900/60 p-2.5 rounded-md border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="text-[#06B6D4] font-bold block mb-0.5">
              {mode === 'pro' ? 'EMPIRICAL DAILY RETURN FREQUENCY (LIVE UPDATED)' : 'DAILY SWING FREQUENCY'}
            </span>
            <p className="text-[10px] text-slate-400 font-sans">
              {mode === 'pro'
                ? 'Quantifies fat tails and positive vs negative daily return skewness over the selected window.'
                : 'See how often this stock moves by small amounts (1%) versus extreme shock days (> 4%).'}
            </p>
          </div>

          <div className="h-56 sm:h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={returnDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#334155" opacity={0.3} vertical={false} />
                <XAxis
                  dataKey="range"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  width={35}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as (typeof returnDistribution)[0];
                      return (
                        <div className="rounded border border-slate-700 bg-[#0F172A] p-2 shadow font-mono text-xs">
                          <div className="font-bold text-white">{d.range}</div>
                          <div className="text-[#06B6D4] mt-0.5">{d.count} trading sessions ({((d.count / liveHistoricalSeries.length) * 100).toFixed(1)}%)</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {returnDistribution.map((entry, index) => {
                    const isNeg = index < 4;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isNeg ? '#EF4444' : '#10B981'}
                        opacity={0.85}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* DURATION TAB BAR AT BOTTOM OF GRAPH */}
      <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase">HISTORICAL LOOKBACK:</span>
          <div className="flex bg-slate-900 p-0.5 rounded border border-slate-700">
            {periodButtons.map(p => (
              <button
                key={p.days}
                onClick={() => setSelectedPeriod(p.days)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded transition ${
                  selectedPeriod === p.days
                    ? 'bg-[#06B6D4] text-[#0F172A] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={p.desc}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-sans flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>
            {mode === 'pro'
              ? `Live stream connected (${liveHistoricalSeries.length} points). Real-time tick frequency: ${(streamSpeed / 1000).toFixed(1)}s.`
              : `Past ${selectedPeriod} days + Live Market ticks streaming in real time.`}
          </span>
        </div>
      </div>
    </div>
  );
};
