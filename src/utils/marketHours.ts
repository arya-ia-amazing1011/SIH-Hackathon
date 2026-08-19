import { StockTicker } from '../types';

export interface MarketStatusInfo {
  isOpen: boolean;
  status: 'regular_open' | 'pre_market' | 'after_hours' | 'closed' | 'crypto_open';
  label: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  detail: string;
  nextEvent: string;
  isRealTimeStreaming: boolean;
}

/**
 * Accurately calculate the live exchange status for a given ticker based on real exchange hours
 */
export function getMarketStatus(ticker: StockTicker, customDate?: Date): MarketStatusInfo {
  const now = customDate || new Date();

  // 1. Crypto Spot Markets (24/7 / 365 Open)
  if (ticker.exchange.toLowerCase().includes('crypto') || ticker.symbol.includes('-USD') || ticker.sector.toLowerCase().includes('digital asset')) {
    return {
      isOpen: true,
      status: 'crypto_open',
      label: '24/7 CRYPTO MARKET OPEN',
      badgeColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-950/40',
      badgeBorder: 'border-emerald-600/50',
      detail: 'Decentralized 24/7/365 continuous trading across global liquidity pools.',
      nextEvent: 'Continuous Trading (Never Closes)',
      isRealTimeStreaming: true,
    };
  }

  // 2. Indian Markets (NSE / BSE) - Timezone: Asia/Kolkata (IST = UTC + 5:30)
  if (ticker.exchange.includes('NSE') || ticker.exchange.includes('BSE') || ticker.currency === 'INR') {
    // Get current time in Indian Standard Time (IST)
    const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istString);
    const day = istDate.getDay(); // 0 = Sun, 6 = Sat
    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const isWeekend = day === 0 || day === 6;
    const marketOpenMinutes = 9 * 60 + 15; // 9:15 AM
    const marketCloseMinutes = 15 * 60 + 30; // 3:30 PM

    if (!isWeekend && currentMinutes >= marketOpenMinutes && currentMinutes < marketCloseMinutes) {
      return {
        isOpen: true,
        status: 'regular_open',
        label: 'NSE / BSE MARKET OPEN',
        badgeColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-950/40',
        badgeBorder: 'border-emerald-600/50',
        detail: 'Live trading active on National Stock Exchange of India (09:15 - 15:30 IST).',
        nextEvent: `Market Closes today at 3:30 PM IST (${Math.floor((marketCloseMinutes - currentMinutes) / 60)}h ${(marketCloseMinutes - currentMinutes) % 60}m remaining)`,
        isRealTimeStreaming: true,
      };
    }

    // Closed
    const dayName = isWeekend ? (day === 0 ? 'Sunday' : 'Saturday') : 'Weekday Evening';
    return {
      isOpen: false,
      status: 'closed',
      label: 'INDIAN MARKET CLOSED',
      badgeColor: 'text-rose-400',
      badgeBg: 'bg-rose-950/40',
      badgeBorder: 'border-rose-600/50',
      detail: `NSE/BSE is currently closed (${dayName} in Mumbai, IST). Official closing quotes are displayed.`,
      nextEvent: isWeekend
        ? 'Opens Monday at 9:15 AM IST'
        : currentMinutes < marketOpenMinutes
        ? 'Opens today at 9:15 AM IST'
        : 'Opens tomorrow at 9:15 AM IST',
      isRealTimeStreaming: false,
    };
  }

  // 3. US Markets (NASDAQ, NYSE) - Timezone: America/New_York (Eastern Time)
  const nyString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const nyDate = new Date(nyString);
  const day = nyDate.getDay(); // 0 = Sun, 6 = Sat
  const hours = nyDate.getHours();
  const minutes = nyDate.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const isWeekend = day === 0 || day === 6;
  const preMarketOpen = 4 * 60; // 4:00 AM ET
  const regularOpen = 9 * 60 + 30; // 9:30 AM ET
  const regularClose = 16 * 60; // 4:00 PM ET
  const afterHoursClose = 20 * 60; // 8:00 PM ET

  if (isWeekend) {
    return {
      isOpen: false,
      status: 'closed',
      label: 'US MARKET CLOSED (WEEKEND)',
      badgeColor: 'text-rose-400',
      badgeBg: 'bg-rose-950/40',
      badgeBorder: 'border-rose-600/50',
      detail: `NASDAQ & NYSE are closed for the weekend (New York Time: ${nyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ET). Showing official Friday closing prices.`,
      nextEvent: 'Opens Monday at 9:30 AM ET',
      isRealTimeStreaming: false,
    };
  }

  // Regular Trading Hours (9:30 AM - 4:00 PM ET)
  if (currentMinutes >= regularOpen && currentMinutes < regularClose) {
    const minsLeft = regularClose - currentMinutes;
    return {
      isOpen: true,
      status: 'regular_open',
      label: 'US MARKET OPEN (REGULAR)',
      badgeColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-950/40',
      badgeBorder: 'border-emerald-600/50',
      detail: `Live continuous market trading active on ${ticker.exchange} (09:30 - 16:00 ET).`,
      nextEvent: `Closes at 4:00 PM ET (${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m remaining)`,
      isRealTimeStreaming: true,
    };
  }

  // After-Hours Trading (4:00 PM - 8:00 PM ET)
  if (currentMinutes >= regularClose && currentMinutes < afterHoursClose) {
    const minsLeft = afterHoursClose - currentMinutes;
    return {
      isOpen: true,
      status: 'after_hours',
      label: 'AFTER-HOURS TRADING (US)',
      badgeColor: 'text-amber-400',
      badgeBg: 'bg-amber-950/40',
      badgeBorder: 'border-amber-600/50',
      detail: `Regular market closed at 4:00 PM ET. Extended electronic after-hours trading active until 8:00 PM ET.`,
      nextEvent: `Extended trading ends at 8:00 PM ET (${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m remaining)`,
      isRealTimeStreaming: true,
    };
  }

  // Pre-Market Trading (4:00 AM - 9:30 AM ET)
  if (currentMinutes >= preMarketOpen && currentMinutes < regularOpen) {
    const minsToOpen = regularOpen - currentMinutes;
    return {
      isOpen: true,
      status: 'pre_market',
      label: 'PRE-MARKET TRADING (US)',
      badgeColor: 'text-sky-400',
      badgeBg: 'bg-sky-950/40',
      badgeBorder: 'border-sky-600/50',
      detail: `Pre-market session active. Regular session begins at 9:30 AM ET.`,
      nextEvent: `Regular market bell in ${Math.floor(minsToOpen / 60)}h ${minsToOpen % 60}m`,
      isRealTimeStreaming: true,
    };
  }

  // Overnight / Closed (8:00 PM - 4:00 AM ET)
  return {
    isOpen: false,
    status: 'closed',
    label: 'US MARKET CLOSED',
    badgeColor: 'text-rose-400',
    badgeBg: 'bg-rose-950/40',
    badgeBorder: 'border-rose-600/50',
    detail: `NASDAQ/NYSE regular & extended sessions are closed (Current NY Time: ${nyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ET). Showing official closing quotes.`,
    nextEvent: currentMinutes >= afterHoursClose ? 'Pre-market opens tomorrow at 4:00 AM ET (Regular Bell at 9:30 AM ET)' : 'Pre-market opens today at 4:00 AM ET (Regular Bell at 9:30 AM ET)',
    isRealTimeStreaming: false,
  };
}
