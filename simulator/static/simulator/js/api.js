/**
 * api.js
 * ---------------------------------------------------------------------------
 * Thin fetch() wrapper around the Django REST endpoints this dashboard
 * expects to exist:
 *
 *   GET /api/search?q=AAPL
 *   GET /api/quote/AAPL
 *   GET /api/history/AAPL?range=1M
 *   GET /api/trending
 *   GET /api/market
 *   GET /api/movers
 *   GET /api/watchlist
 *   GET /api/portfolio
 *   GET /api/portfolio/history?range=1M
 *   GET /api/transactions
 *   GET /api/news
 *
 * Every method races the real request against a short timeout and, on any
 * failure (network error, non-2xx, bad JSON, timeout), resolves with
 * realistic placeholder data instead of throwing. Nothing upstream needs to
 * know or care whether a payload is real yet — once the Django views exist,
 * this file is the *only* thing that ever needs to change.
 * ---------------------------------------------------------------------------
 */

const REQUEST_TIMEOUT_MS = 4000;

/* ============================================================================
 * Deterministic "randomness" — placeholder data should look alive without
 * re-rolling into a different shape every re-render, so everything below is
 * seeded from a string (usually a ticker symbol).
 * ========================================================================== */

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function todaySalt() {
  return new Date().toISOString().slice(0, 10);
}

/* ============================================================================
 * Reference universe — real, recognizable tickers so the UI reads like a
 * real market instead of "AcmeCorp". Prices/changes are entirely synthetic
 * placeholders regenerated below; treat every number as fake demo data.
 * ========================================================================== */

const COMPANY_UNIVERSE = [
  { symbol: 'AAPL', name: 'Apple Inc.', base: 213.4, sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', base: 441.2, sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', base: 178.9, sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', base: 196.3, sector: 'Consumer' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', base: 132.8, sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', base: 244.1, sector: 'Consumer' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', base: 512.7, sector: 'Technology' },
  { symbol: 'NFLX', name: 'Netflix, Inc.', base: 683.5, sector: 'Communication' },
  { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.', base: 158.6, sector: 'Technology' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', base: 214.9, sector: 'Financials' },
  { symbol: 'V', name: 'Visa Inc.', base: 289.4, sector: 'Financials' },
  { symbol: 'DIS', name: 'The Walt Disney Company', base: 111.3, sector: 'Communication' },
  { symbol: 'BA', name: 'The Boeing Company', base: 187.2, sector: 'Industrials' },
  { symbol: 'KO', name: 'The Coca-Cola Company', base: 68.9, sector: 'Consumer' },
  { symbol: 'PEP', name: 'PepsiCo, Inc.', base: 172.4, sector: 'Consumer' },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', base: 118.6, sector: 'Energy' },
  { symbol: 'WMT', name: 'Walmart Inc.', base: 92.7, sector: 'Consumer' },
  { symbol: 'PLTR', name: 'Palantir Technologies Inc.', base: 118.2, sector: 'Technology' },
  { symbol: 'CRM', name: 'Salesforce, Inc.', base: 306.5, sector: 'Technology' },
  { symbol: 'ADBE', name: 'Adobe Inc.', base: 468.1, sector: 'Technology' },
  { symbol: 'ORCL', name: 'Oracle Corporation', base: 178.3, sector: 'Technology' },
  { symbol: 'INTC', name: 'Intel Corporation', base: 30.4, sector: 'Technology' },
  { symbol: 'UBER', name: 'Uber Technologies, Inc.', base: 84.6, sector: 'Technology' },
  { symbol: 'SHOP', name: 'Shopify Inc.', base: 96.8, sector: 'Technology' },
];

const WATCHLIST_SYMBOLS = ['AAPL', 'NVDA', 'TSLA', 'AMZN', 'PLTR', 'CRM'];

const NEWS_SOURCES = ['MarketPulse', 'Street Insights', 'TradeSims Wire', 'Ledger Daily', 'Capital Brief'];

const NEWS_TEMPLATES = [
  (c) => `${c} shares move after analysts revisit price targets`,
  (c) => `What to watch from ${c}'s latest earnings call`,
  (c) => `${c} announces new product roadmap for the year ahead`,
  (c) => `Institutional investors adjust positions in ${c}`,
  (c) => `${c} trades actively as sector rotation continues`,
  (c) => `Options activity spikes in ${c} ahead of next report`,
];

/* ============================================================================
 * Placeholder data generators
 * ========================================================================== */

function generateSparkline(seedStr, points = 24, volatility = 0.018) {
  const rng = mulberry32(hashSeed(seedStr));
  const series = [1];
  for (let i = 1; i < points; i++) {
    const drift = (rng() - 0.47) * volatility;
    series.push(Math.max(0.05, series[i - 1] * (1 + drift)));
  }
  return series;
}

/** One cached, internally-consistent "today" stat per symbol so every
 *  section (trending, movers, watchlist, quote) agrees with each other. */
const _dailyStatCache = new Map();

function getDailyStat(symbol, base) {
  const cacheKey = `${symbol}:${todaySalt()}`;
  if (_dailyStatCache.has(cacheKey)) return _dailyStatCache.get(cacheKey);

  const rng = mulberry32(hashSeed(cacheKey));
  const changePercent = (rng() - 0.46) * 6.5; // roughly -3% .. +3.4%
  const price = base * (1 + changePercent / 100);
  const change = price - base;
  const spark = generateSparkline(cacheKey, 28, 0.012);
  // rescale sparkline so it ends near the actual changePercent
  const lastRatio = spark[spark.length - 1];
  const scaled = spark.map((v) => base * (v / lastRatio) * (1 + changePercent / 100));

  const stat = {
    price: round2(price),
    change: round2(change),
    changePercent: round2(changePercent),
    dayHigh: round2(Math.max(...scaled, price) * 1.004),
    dayLow: round2(Math.min(...scaled, price) * 0.996),
    volume: Math.floor(8_000_000 + rng() * 42_000_000),
    sparkline: scaled.map(round2),
  };
  _dailyStatCache.set(cacheKey, stat);
  return stat;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function companyBySymbol(symbol) {
  return COMPANY_UNIVERSE.find((c) => c.symbol === symbol.toUpperCase());
}

function buildQuote(company) {
  const stat = getDailyStat(company.symbol, company.base);
  return { symbol: company.symbol, name: company.name, sector: company.sector, ...stat };
}

function placeholderSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return COMPANY_UNIVERSE.filter(
    (c) => c.symbol.toLowerCase().startsWith(q) || c.name.toLowerCase().includes(q)
  )
    .slice(0, 8)
    .map(buildQuote);
}

function placeholderQuote(symbol) {
  const company = companyBySymbol(symbol) || {
    symbol: symbol.toUpperCase(),
    name: `${symbol.toUpperCase()} Corp.`,
    base: 50 + (hashSeed(symbol) % 200),
    sector: 'Unknown',
  };
  return buildQuote(company);
}

function businessDaysBack(n) {
  const dates = [];
  const d = new Date();
  while (dates.length < n) {
    d.setDate(d.getDate() - 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) dates.push(d.toISOString().slice(0, 10));
  }
  return dates.reverse();
}

/** Full daily OHLC history for a symbol, oldest -> newest, ending today. */
function placeholderDailySeries(seedStr, base, totalDays = 400) {
  const dates = businessDaysBack(totalDays - 1);
  dates.push(new Date().toISOString().slice(0, 10));
  const rng = mulberry32(hashSeed(seedStr));
  const drift = 0.0006; // gentle long-run upward drift
  let close = base * 0.72; // start lower so the series shows real growth
  return dates.map((time) => {
    const changePct = (rng() - 0.478) * 0.028 + drift;
    const open = close;
    close = Math.max(1, open * (1 + changePct));
    const high = Math.max(open, close) * (1 + rng() * 0.006);
    const low = Math.min(open, close) * (1 - rng() * 0.006);
    return { time, open: round2(open), high: round2(high), low: round2(low), close: round2(close) };
  });
}

/** Intraday five-minute bars for the "1D" chart range, landing near `endValue`. */
function placeholderIntradaySeries(seedStr, endValue) {
  const rng = mulberry32(hashSeed(seedStr + ':intraday'));
  const bars = 78; // 6.5 trading hours in 5-minute bars
  const start = endValue * (1 + (rng() - 0.5) * 0.02);
  const now = new Date();
  const marketOpen = Math.floor(
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30, 0).getTime() / 1000
  );
  let close = start;
  const points = [];
  for (let i = 0; i < bars; i++) {
    const target = start + (endValue - start) * (i / (bars - 1));
    const noise = (rng() - 0.5) * endValue * 0.0025;
    const open = close;
    close = target + noise;
    const high = Math.max(open, close) + rng() * endValue * 0.0008;
    const low = Math.min(open, close) - rng() * endValue * 0.0008;
    points.push({
      time: marketOpen + i * 300,
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
    });
  }
  points[points.length - 1].close = round2(endValue);
  return points;
}

function sliceRange(dailySeries, range) {
  const counts = { '1W': 7, '1M': 22, '3M': 63, '1Y': 252, ALL: dailySeries.length };
  const n = counts[range] ?? dailySeries.length;
  return dailySeries.slice(-n);
}

function placeholderNewsThumbSeed(headline) {
  return hashSeed(headline) % 360;
}

function placeholderNews() {
  const rng = mulberry32(hashSeed(`news:${todaySalt()}`));
  const picks = [...COMPANY_UNIVERSE].sort(() => rng() - 0.5).slice(0, 6);
  return picks.map((c, i) => {
    const headline = NEWS_TEMPLATES[i % NEWS_TEMPLATES.length](c.name);
    const hoursAgo = Math.floor(1 + rng() * 9);
    return {
      id: `${c.symbol}-${i}`,
      source: NEWS_SOURCES[i % NEWS_SOURCES.length],
      headline,
      description: `A look at how ${c.symbol} is trading today and what analysts are watching heading into the next session.`,
      timestamp: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
      hue: placeholderNewsThumbSeed(headline),
      symbol: c.symbol,
      imageUrl: null,
    };
  });
}

function placeholderTransactions() {
  const rng = mulberry32(hashSeed(`tx:${todaySalt()}`));
  const types = ['buy', 'sell'];
  return Array.from({ length: 9 }, (_, i) => {
    const company = COMPANY_UNIVERSE[Math.floor(rng() * COMPANY_UNIVERSE.length)];
    const type = types[rng() > 0.42 ? 0 : 1];
    const shares = Math.max(1, Math.floor(rng() * 40));
    const price = round2(company.base * (1 + (rng() - 0.5) * 0.1));
    const daysAgo = Math.floor(rng() * 21);
    return {
      id: `tx-${i}`,
      type,
      symbol: company.symbol,
      name: company.name,
      shares,
      price,
      total: round2(shares * price),
      date: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
      status: 'Completed',
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function placeholderPortfolioSnapshot() {
  const rng = mulberry32(hashSeed(`portfolio:${todaySalt()}`));
  const totalValue = 118_000 + rng() * 20_000;
  const todayChangePercent = (rng() - 0.42) * 3.2;
  const todayChange = (totalValue * todayChangePercent) / 100;
  return {
    totalValue: round2(totalValue),
    todayChange: round2(todayChange),
    todayChangePercent: round2(todayChangePercent),
    buyingPower: round2(4_000 + rng() * 9_000),
  };
}

const INDEX_UNIVERSE = [
  { symbol: 'SPX', name: 'S&P 500', base: 6185.4 },
  { symbol: 'IXIC', name: 'NASDAQ Composite', base: 20142.8 },
  { symbol: 'DJI', name: 'Dow Jones', base: 43910.2 },
];

/* ============================================================================
 * Fetch helper
 * ========================================================================== */

async function fetchJSON(url, { timeout = REQUEST_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`${url} responded ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function withFallback(url, fallbackFn, options) {
  try {
    return await fetchJSON(url, options);
  } catch (err) {
    console.info(`[StockAPI] using placeholder data for ${url} (${err.message})`);
    return fallbackFn();
  }
}

/* ============================================================================
 * Public API
 * ========================================================================== */

export class StockAPI {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async search(query) {
    if (!query || !query.trim()) return [];
    const url = `${this.baseUrl}/api/search?q=${encodeURIComponent(query)}`;
    return withFallback(url, () => placeholderSearch(query));
  }

  async getQuote(symbol) {
    const url = `${this.baseUrl}/api/quote/${encodeURIComponent(symbol)}`;
    return withFallback(url, () => placeholderQuote(symbol));
  }

  async getHistorical(symbol, range = '3M') {
    const url = `${this.baseUrl}/api/history/${encodeURIComponent(symbol)}?range=${range}`;
    return withFallback(url, () => {
      const company = companyBySymbol(symbol) || { base: placeholderQuote(symbol).price };
      const daily = placeholderDailySeries(`hist:${symbol}`, company.base);
      if (range === '1D') return placeholderIntradaySeries(`hist:${symbol}`, daily[daily.length - 1].close);
      return sliceRange(daily, range);
    });
  }

  async getTrending() {
    const url = `${this.baseUrl}/api/trending`;
    return withFallback(url, () => COMPANY_UNIVERSE.slice(0, 10).map(buildQuote));
  }

  async getMarketOverview() {
    const url = `${this.baseUrl}/api/market`;
    return withFallback(url, () =>
      INDEX_UNIVERSE.map((idx) => ({ ...idx, ...getDailyStat(idx.symbol, idx.base) }))
    );
  }

  async getMovers() {
    const url = `${this.baseUrl}/api/movers`;
    return withFallback(url, () => {
      const quoted = COMPANY_UNIVERSE.map(buildQuote).sort((a, b) => b.changePercent - a.changePercent);
      return { gainers: quoted.slice(0, 5), losers: quoted.slice(-5).reverse() };
    });
  }

  async getWatchlist() {
    const url = `${this.baseUrl}/api/watchlist`;
    return withFallback(url, () =>
      WATCHLIST_SYMBOLS.map((sym) => buildQuote(companyBySymbol(sym)))
    );
  }

  async getPortfolio() {
    const url = `${this.baseUrl}/api/portfolio`;
    return withFallback(url, () => placeholderPortfolioSnapshot());
  }

  async getPortfolioHistory(range = '3M') {
    const url = `${this.baseUrl}/api/portfolio/history?range=${range}`;
    return withFallback(url, () => {
      const snapshot = placeholderPortfolioSnapshot();
      const daily = placeholderDailySeries('portfolio', snapshot.totalValue * 0.9);
      if (range === '1D') return placeholderIntradaySeries('portfolio', daily[daily.length - 1].close);
      return sliceRange(daily, range);
    });
  }

  async getTransactions() {
    const url = `${this.baseUrl}/api/transactions`;
    return withFallback(url, () => placeholderTransactions());
  }

  async getNews() {
    const url = `${this.baseUrl}/api/news`;
    return withFallback(url, () => placeholderNews());
  }
}

export const stockAPI = new StockAPI();
