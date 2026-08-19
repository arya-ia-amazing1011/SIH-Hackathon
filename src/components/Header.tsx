import React, { useState, useMemo } from 'react';
import {
  Search,
  Sliders,
  Key,
  FileText,
  Activity,
  Layers,
  Sparkles,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Shield,
  Clock,
  Radio,
  ChevronDown,
  Globe,
  Check,
  X
} from 'lucide-react';
import { Mode, StockTicker, ViewTab } from '../types';
import { POPULAR_TICKERS } from '../data/mockTickers';
import { getMarketStatus } from '../utils/marketHours';

interface HeaderProps {
  currentTicker: StockTicker;
  onSelectTicker: (ticker: StockTicker) => void;
  mode: Mode;
  onToggleMode: () => void;
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onOpenPitchCardModal: () => void;
  isAiLoading: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'All (25+)', icon: '🌐' },
  { id: 'ai_tech', label: 'AI & Big Tech', icon: '🤖' },
  { id: 'semiconductors', label: 'Semiconductors', icon: '⚡' },
  { id: 'finance', label: 'Finance & Banking', icon: '🏦' },
  { id: 'consumer', label: 'Consumer & Media', icon: '🎬' },
  { id: 'healthcare', label: 'Healthcare & GLP-1', icon: '💊' },
  { id: 'india', label: 'India (NSE / BSE)', icon: '🇮🇳' },
  { id: 'crypto', label: '24/7 Crypto', icon: '🪙' },
];

export const Header: React.FC<HeaderProps> = ({
  currentTicker,
  onSelectTicker,
  mode,
  onToggleMode,
  activeTab,
  onSelectTab,
  onOpenPitchCardModal,
  isAiLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Compute live market status for currently selected ticker
  const marketStatus = useMemo(() => getMarketStatus(currentTicker), [currentTicker]);

  const filteredTickers = useMemo(() => {
    let list = POPULAR_TICKERS;
    if (selectedCategory !== 'all') {
      list = list.filter(t => t.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        t =>
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.sector.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  const handleCustomSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    if (!query) return;

    const matched = POPULAR_TICKERS.find(t => t.symbol === query);
    if (matched) {
      onSelectTicker(matched);
    } else {
      const customTicker: StockTicker = {
        symbol: query,
        name: `${query} Equity`,
        price: 100.0,
        currency: 'USD',
        change: 1.5,
        changePercent: 1.52,
        high52: 125.0,
        low52: 75.0,
        volatility: 0.32,
        drift: 0.12,
        beta: 1.15,
        peRatio: 24.5,
        marketCap: '$45.0 Billion',
        sector: 'Global Equities',
        exchange: 'Global Market',
        description: `Active investment asset ${query} monitored across global quant benchmarks.`,
        eli5Description: `${query} is a publicly traded company tracked by financial markets.`,
        studentDescription: `${query} is a publicly traded stock with simulated market volatility and growth trend.`,
      };
      onSelectTicker(customTicker);
    }
    setSearchQuery('');
    setIsSearchOpen(false);
    setIsCatalogOpen(false);
  };

  return (
    <header className="border-b border-slate-700/50 bg-[#0F172A] px-3 sm:px-5 py-2 sticky top-0 z-30 backdrop-blur-md space-y-2">
      {/* Top row: Brand, Ticker search, Market Status, Mode toggles, Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Search */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => onSelectTab('all')}>
            <div className="w-7 h-7 bg-[#06B6D4] rounded flex items-center justify-center shadow-md shadow-[#06B6D4]/20">
              <div className="w-3.5 h-3.5 border-2 border-[#0F172A] rotate-45"></div>
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tighter text-white font-mono flex items-baseline">
              QUANTPILOT <span className="text-[#06B6D4] font-mono text-[10px] ml-1 font-semibold">PRO</span>
            </h1>
          </div>

          {/* Stock Catalog Selector Button */}
          <button
            onClick={() => setIsCatalogOpen(!isCatalogOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-[#06B6D4]/60 rounded-md text-xs font-mono text-white transition shadow-sm"
            title="Browse 25+ Global Stocks, Indian Markets & Cryptocurrencies"
          >
            <Globe className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span className="font-bold text-[#06B6D4]">{currentTicker.symbol}</span>
            <span className="hidden sm:inline text-slate-300 truncate max-w-[90px]">{currentTicker.name.split(' ')[0]}</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isCatalogOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Search input with high-density style */}
          <div className="relative w-36 sm:w-48 lg:w-56">
            <form onSubmit={handleCustomSearchSubmit} className="flex items-center bg-[#1E293B] border border-slate-700 rounded-md px-2.5 py-1 focus-within:border-[#06B6D4] transition">
              <Search className="w-3.5 h-3.5 text-slate-500 mr-1.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search 25+ stocks..."
                className="bg-transparent border-none outline-none text-xs w-full font-mono text-[#06B6D4] placeholder-slate-500 uppercase"
              />
            </form>

            {/* Quick Search Dropdown */}
            {isSearchOpen && searchQuery.trim() && (
              <div
                className="absolute left-0 top-full mt-1 w-72 rounded-md border border-slate-700 bg-[#1E293B] shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto"
                onMouseLeave={() => setIsSearchOpen(false)}
              >
                {filteredTickers.map(t => (
                  <button
                    key={t.symbol}
                    onClick={() => {
                      onSelectTicker(t);
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-700/60 transition text-xs font-mono border-b border-slate-800 last:border-0"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#06B6D4]">{t.symbol}</span>
                        <span className="text-[10px] px-1 bg-slate-800 rounded text-slate-400 border border-slate-700">{t.exchange}</span>
                      </div>
                      <span className="text-slate-300 font-sans text-[11px] truncate block max-w-[170px]">{t.name}</span>
                    </div>
                    <span className="text-slate-200 font-semibold font-mono">
                      {t.currency === 'INR' ? '₹' : '$'}{t.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Live Market Exchange Status Indicator */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono rounded-md border ${marketStatus.badgeBg} ${marketStatus.badgeBorder} ${marketStatus.badgeColor}`}
            title={marketStatus.detail}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${marketStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
            <span className="font-bold">{marketStatus.label}</span>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quant Pro vs Student (Beginner) Mode Toggle */}
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => mode !== 'pro' && onToggleMode()}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold font-mono rounded transition ${
                mode === 'pro'
                  ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Institutional Quantitative Mode"
            >
              <Shield className="w-3 h-3 text-[#06B6D4]" />
              <span>QUANT PRO</span>
            </button>
            <button
              onClick={() => mode !== 'student' && onToggleMode()}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold font-mono rounded transition ${
                mode === 'student'
                  ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Student & Beginner Mode with Plain English Explanations"
            >
              <GraduationCap className="w-3 h-3 text-[#10B981]" />
              <span>STUDENT MODE</span>
            </button>
          </div>

          {/* AI Synthesis Status Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border bg-slate-800/90 border-[#06B6D4]/40 text-[#06B6D4]"
            title="Gemini Quantitative Engine Active"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span className="hidden xl:inline text-[11px] font-bold">AI ACTIVE</span>
            {isAiLoading && <Activity className="w-3 h-3 animate-spin text-[#06B6D4]" />}
          </div>

          {/* Pitch Export Button */}
          <button
            onClick={onOpenPitchCardModal}
            className="flex items-center gap-1 px-3 py-1 bg-[#06B6D4] text-[#0F172A] text-xs font-bold font-mono rounded hover:bg-[#22D3EE] transition shadow-md shadow-[#06B6D4]/20 active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">EXPORT PITCH</span>
            <span className="sm:hidden">PITCH</span>
          </button>
        </div>
      </div>

      {/* Stock Directory Drawer / Modal (Category-Filtered Multi-Market Catalog) */}
      {isCatalogOpen && (
        <div className="p-3 bg-[#1E293B] border border-slate-700 rounded-xl shadow-2xl space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#06B6D4]" />
              <span className="text-xs font-bold font-mono text-white">SELECT ASSET FROM GLOBAL DIRECTORY (25+ TICKERS)</span>
            </div>
            <button
              onClick={() => setIsCatalogOpen(false)}
              className="text-slate-400 hover:text-white text-xs font-mono flex items-center gap-1 p-1 hover:bg-slate-700 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 font-mono text-[11px]">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md transition whitespace-nowrap flex items-center gap-1 font-semibold ${
                  selectedCategory === cat.id
                    ? 'bg-[#06B6D4] text-[#0F172A] shadow-md shadow-[#06B6D4]/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/80'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Ticker Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-64 overflow-y-auto pr-1">
            {filteredTickers.map(t => {
              const isSelected = t.symbol === currentTicker.symbol;
              const status = getMarketStatus(t);
              return (
                <button
                  key={t.symbol}
                  onClick={() => {
                    onSelectTicker(t);
                    setIsCatalogOpen(false);
                  }}
                  className={`p-2 rounded-lg border text-left transition flex flex-col justify-between font-mono ${
                    isSelected
                      ? 'bg-[#06B6D4]/15 border-[#06B6D4] shadow-sm ring-1 ring-[#06B6D4]/40'
                      : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-500 hover:bg-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-white">{t.symbol}</span>
                    <span className={`text-[8px] font-bold px-1 rounded ${status.isOpen ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                      {status.isOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 truncate font-sans mt-0.5">{t.name}</p>
                  <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-slate-700/50">
                    <span className="text-xs font-bold text-[#06B6D4]">
                      {t.currency === 'INR' ? '₹' : '$'}{t.price.toFixed(2)}
                    </span>
                    <span className={`text-[10px] font-semibold ${t.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.change >= 0 ? '+' : ''}{t.changePercent.toFixed(1)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Module Navigation Tabs */}
      <div className="flex items-center justify-between gap-1 border-t border-slate-800/80 pt-1.5 overflow-x-auto scrollbar-none font-mono text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectTab('all')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition text-[11px] font-bold shrink-0 ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>ALL MODULES</span>
          </button>

          <button
            onClick={() => onSelectTab('simulator')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition text-[11px] font-bold shrink-0 ${
              activeTab === 'simulator'
                ? 'bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/40 shadow-sm'
                : 'text-slate-400 hover:text-[#06B6D4] hover:bg-slate-900/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>MONTE CARLO SIMULATOR</span>
            <span className="text-[9px] bg-[#06B6D4]/20 px-1 rounded text-[#06B6D4]">15 PATHS</span>
          </button>

          <button
            onClick={() => onSelectTab('macro')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition text-[11px] font-bold shrink-0 ${
              activeTab === 'macro'
                ? 'bg-purple-950/40 text-purple-300 border border-purple-700/50 shadow-sm'
                : 'text-slate-400 hover:text-purple-300 hover:bg-slate-900/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>MACRO STRESS-TEST</span>
          </button>

          <button
            onClick={() => onSelectTab('qualitative')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition text-[11px] font-bold shrink-0 ${
              activeTab === 'qualitative'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 shadow-sm'
                : 'text-slate-400 hover:text-[#10B981] hover:bg-slate-900/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#10B981]" />
            <span>QUALITATIVE INTELLIGENCE</span>
          </button>
        </div>

        {/* Quick Ticker Chips Bar */}
        <div className="hidden lg:flex items-center gap-1 shrink-0">
          {['NVDA', 'GOOGL', 'TSLA', 'AAPL', 'BTC-USD', 'RELIANCE', 'LLY', 'JPM'].map(sym => {
            const t = POPULAR_TICKERS.find(item => item.symbol === sym);
            if (!t) return null;
            const isSelected = t.symbol === currentTicker.symbol;
            return (
              <button
                key={t.symbol}
                onClick={() => onSelectTicker(t)}
                className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded transition ${
                  isSelected
                    ? 'bg-[#06B6D4]/20 border border-[#06B6D4] text-[#06B6D4]'
                    : 'bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.symbol}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};


