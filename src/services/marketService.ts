import { StockTicker } from '../types';
import { getMarketStatus, MarketStatusInfo } from '../utils/marketHours';
import { POPULAR_TICKERS } from '../data/mockTickers';

export interface LiveMarketQuote {
  symbol: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  high52: number;
  low52: number;
  marketStatus: MarketStatusInfo;
  lastUpdated: string;
  source: 'live_exchange' | 'official_close' | 'crypto_spot';
}

/**
 * Fetch real-time market quote and exchange status for any symbol
 */
export async function fetchLiveMarketQuote(ticker: StockTicker): Promise<LiveMarketQuote> {
  const status = getMarketStatus(ticker);

  try {
    const res = await fetch(`/api/market/quote?symbol=${encodeURIComponent(ticker.symbol)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.quote) {
        return {
          ...data.quote,
          marketStatus: status,
        };
      }
    }
  } catch {
    // Graceful fallback to client-computed exchange hours and baseline quote
  }

  return {
    symbol: ticker.symbol,
    price: ticker.price,
    currency: ticker.currency,
    change: ticker.change,
    changePercent: ticker.changePercent,
    high52: ticker.high52,
    low52: ticker.low52,
    marketStatus: status,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    source: status.isOpen ? (status.status === 'crypto_open' ? 'crypto_spot' : 'live_exchange') : 'official_close',
  };
}

/**
 * Filter tickers by category or search term
 */
export function filterTickers(
  category: string,
  searchQuery: string
): StockTicker[] {
  let list = POPULAR_TICKERS;

  if (category && category !== 'all') {
    list = list.filter(t => t.category === category);
  }

  if (searchQuery.trim()) {
    const query = searchQuery.trim().toLowerCase();
    list = list.filter(
      t =>
        t.symbol.toLowerCase().includes(query) ||
        t.name.toLowerCase().includes(query) ||
        t.sector.toLowerCase().includes(query)
    );
  }

  return list;
}
