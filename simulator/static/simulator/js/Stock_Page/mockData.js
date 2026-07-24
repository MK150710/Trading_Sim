(function () {
    'use strict';

    function hashSeed(str) {
        let h = 1779033703 ^ str.length;
        for (let i = 0; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
        }
        return () => {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            h ^= h >>> 16;
            return (h >>> 0) / 4294967296;
        };
    }

    function rngFor(seedStr) {
        const seedFn = hashSeed(seedStr);
        let a = (seedFn() * 4294967296) >>> 0;
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
    function round2(n) { return Math.round(n * 100) / 100; }

    const COMPANIES = {
        AAPL:  { name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Consumer Electronics', ceo: 'T. Cook', hq: 'Cupertino, CA', employees: '164,000', website: 'apple.com', base: 214, colors: ['#8E8E93', '#3A3A3C'] },
        MSFT:  { name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology', industry: 'Software—Infrastructure', ceo: 'S. Nadella', hq: 'Redmond, WA', employees: '228,000', website: 'microsoft.com', base: 468, colors: ['#00A4EF', '#0067B8'] },
        GOOGL: { name: 'Alphabet Inc.', exchange: 'NASDAQ', sector: 'Communication Services', industry: 'Internet Content & Information', ceo: 'S. Pichai', hq: 'Mountain View, CA', employees: '182,000', website: 'abc.xyz', base: 192, colors: ['#4285F4', '#34A853'] },
        AMZN:  { name: 'Amazon.com, Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', industry: 'Internet Retail', ceo: 'A. Jassy', hq: 'Seattle, WA', employees: '1,550,000', website: 'amazon.com', base: 228, colors: ['#FF9900', '#146EB4'] },
        NVDA:  { name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors', ceo: 'J. Huang', hq: 'Santa Clara, CA', employees: '36,000', website: 'nvidia.com', base: 172, colors: ['#76B900', '#1A1A1A'] },
        TSLA:  { name: 'Tesla, Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers', ceo: 'E. Musk', hq: 'Austin, TX', employees: '140,000', website: 'tesla.com', base: 262, colors: ['#E31937', '#171A20'] },
        META:  { name: 'Meta Platforms, Inc.', exchange: 'NASDAQ', sector: 'Communication Services', industry: 'Internet Content & Information', ceo: 'M. Zuckerberg', hq: 'Menlo Park, CA', employees: '76,800', website: 'meta.com', base: 612, colors: ['#0668E1', '#0A2A5E'] },
        NFLX:  { name: 'Netflix, Inc.', exchange: 'NASDAQ', sector: 'Communication Services', industry: 'Entertainment', ceo: 'T. Sarandos', hq: 'Los Gatos, CA', employees: '14,000', website: 'netflix.com', base: 1180, colors: ['#E50914', '#221F1F'] },
        AMD:   { name: 'Advanced Micro Devices', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors', ceo: 'L. Su', hq: 'Santa Clara, CA', employees: '26,000', website: 'amd.com', base: 148, colors: ['#ED1C24', '#000000'] },
        JPM:   { name: 'JPMorgan Chase & Co.', exchange: 'NYSE', sector: 'Financial Services', industry: 'Banks—Diversified', ceo: 'J. Dimon', hq: 'New York, NY', employees: '317,000', website: 'jpmorganchase.com', base: 268, colors: ['#0F3A6B', '#5B8DBF'] },
        DIS:   { name: 'The Walt Disney Company', exchange: 'NYSE', sector: 'Communication Services', industry: 'Entertainment', ceo: 'B. Iger', hq: 'Burbank, CA', employees: '233,000', website: 'disney.com', base: 112, colors: ['#113CCF', '#0A2472'] },
        UBER:  { name: 'Uber Technologies, Inc.', exchange: 'NYSE', sector: 'Technology', industry: 'Software—Application', ceo: 'D. Khosrowshahi', hq: 'San Francisco, CA', employees: '33,000', website: 'uber.com', base: 92, colors: ['#000000', '#3A3A3A'] },
        SBUX:  { name: 'Starbucks Corporation', exchange: 'NASDAQ', sector: 'Consumer Cyclical', industry: 'Restaurants', ceo: 'B. Niccol', hq: 'Seattle, WA', employees: '381,000', website: 'starbucks.com', base: 96, colors: ['#00704A', '#1E3932'] }
    };
    const SYMBOL_LIST = Object.keys(COMPANIES);

    function companyFor(symbol) {
        const sym = symbol.toUpperCase();
        if (COMPANIES[sym]) return { symbol: sym, ...COMPANIES[sym] };
        const rng = rngFor(sym);
        const sectors = ['Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical', 'Industrials', 'Energy'];
        const sector = pick(rng, sectors);
        const colorPairs = [['#2E6BFF', '#4F46E5'], ['#0EA97A', '#2DD4BF'], ['#E23A54', '#FF6B6B'], ['#7C3AED', '#22D3EE'], ['#F0A93A', '#E23A54']];
        return {
            symbol: sym, name: sym + ' Holdings, Inc.', exchange: rng() > 0.5 ? 'NASDAQ' : 'NYSE',
            sector, industry: sector + 'Services', ceo: 'A. Rivera', hq: 'Wilmington, DE',
            employees: (Math.floor(rng() * 90) + 2) + ',000', website: sym.toLowerCase() + '.com',
            base: round2(20 + rng() * 380), colors: pick(rng, colorPairs)
        };
    }

    const liveState = {};
    function getStock(symbol) {
        const sym = symbol.toUpperCase();
        const co = companyFor(sym);
        if (!liveState[sym]) {
            const rng = rngFor(sym + ':quote');
            const prevClose = co.base;
            const changePercent = round2((rng() - 0.45) * 4.2);
            const price = round2(prevClose * (1 + changePercent / 100));
            const dayRange = Math.abs(price - prevClose) + price * 0.012;
            liveState[sym] = {
            price, prevClose,
            open: round2(prevClose * (1 + (rng() - 0.5) * 0.012)),
            dayHigh: round2(Math.max(price, prevClose) + dayRange * rng()),
            dayLow: round2(Math.min(price, prevClose) - dayRange * rng()),
            week52High: round2(price * (1.12 + rng() * 0.28)),
            week52Low: round2(price * (0.62 + rng() * 0.18)),
            marketCap: price * (rng() * 900 + 40) * 1e6,
            volume: Math.floor(rng() * 60_000_000 + 2_000_000),
            avgVolume: Math.floor(rng() * 55_000_000 + 3_000_000),
            peRatio: round2(rng() * 42 + 8),
            eps: round2(price / (rng() * 30 + 10)),
            dividendYield: rng() > 0.4 ? round2(rng() * 2.4) : 0,
            beta: round2(0.6 + rng() * 1.3),
            rng
            };
        }
        const s = liveState[sym];
        const change = round2(s.price - s.prevClose);
        const changePercent = round2((change / s.prevClose) * 100);
        return {
            symbol: sym, name: co.name, exchange: co.exchange, sector: co.sector,
            industry: co.industry, ceo: co.ceo, hq: co.hq, employees: co.employees,
            website: co.website, logoColors: co.colors,
            price: s.price, prevClose: s.prevClose, open: s.open,
            dayHigh: Math.max(s.dayHigh, s.price), dayLow: Math.min(s.dayLow, s.price),
            change, changePercent,
            week52High: s.week52High, week52Low: s.week52Low,
            marketCap: s.marketCap, volume: s.volume, avgVolume: s.avgVolume,
            peRatio: s.peRatio, eps: s.eps, dividendYield: s.dividendYield, beta: s.beta,
            marketStatus: marketStatus(), lastUpdated: new Date()
        };
    }

    function tickStock(symbol) {
        const sym = symbol.toUpperCase();
        const s = liveState[sym];
        if (!s) return getStock(sym);
        const drift = (s.rng() - 0.5) * s.price * 0.0016;
        s.price = round2(Math.max(0.5, s.price + drift));
        return getStock(sym);
    }

    function marketStatus() {
        const now = new Date();
        const day = now.getUTCDay();
        const estHour = (now.getUTCHours() - 4 + 24) % 24;
        const minutes = estHour * 60 + now.getUTCMinutes();
        const isWeekday = day >= 1 && day <= 5;
        if (isWeekday && minutes >= 570 && minutes < 960) return 'open';
        if (isWeekday && ((minutes >= 240 && minutes < 570) || (minutes >= 960 && minutes < 1200))) return 'extended';
        return 'closed';
    }

    const TIMEFRAMES = {
        '1D': { points: 78, unit: 'minute', span: 1 },
        '5D': { points: 65, unit: 'hour', span: 5 },
        '1M': { points: 22, unit: 'day', span: 30 },
        '3M': { points: 64, unit: 'day', span: 90 },
        '6M': { points: 126, unit: 'day', span: 182 },
        'YTD': { points: 140, unit: 'day', span: 200 },
        '1Y': { points: 252, unit: 'day', span: 365 },
        '5Y': { points: 60, unit: 'month', span: 1825 },
        'MAX': { points: 96, unit: 'month', span: 3650 }
    };

    function regimeSequence(rng, n) {
        const types = ['uptrend', 'downtrend', 'pullback', 'consolidation', 'spike'];
        const segs = [];
        let remaining = n;
        while (remaining > 0) {
            const type = pick(rng, types);
            const len = type === 'spike'
                ? Math.min(remaining, 1 + Math.floor(rng() * 3))
                : Math.min(remaining, Math.floor(n * (0.12 + rng() * 0.28)) + 3);
            segs.push({ type, len });
            remaining -= len;    
        }
        return segs;
    }

    function buildWalk(rng, n, volFactor) {
        const segs = regimeSequence(rng, n);
        const out = [1];
        let level = 1;
        segs.forEach(seg => {
            for (let i = 0; i < seg.len && out.length < n; i++) {
                let drift = 0, noise = (rng() - 0.5) * volFactor
                if (seg.type === 'uptrend') drift = volFactor * 0.32;
                else if (seg.type === 'downtrend') drift = -volFactor * 0.32;
                else if (seg.type === 'pullback') drift = -volFactor * 0.18;
                else if (seg.type === 'consolidation') { drift = 0; noise *= 0.35; }
                else if (seg.type === 'spike') drift = (rng() > 0.5 ? 1 : -1) * volFactor * (2.4 + rng() * 2); 
                level = Math.max(0.05, level + drift + noise);
                out.push(level);
            }
        });
        while (out.length < n) out.push(out[out.length - 1]);
        return out.slice(0, n);
    }

    function labelFor(unit, idx, n, now) {
        const d = new Date(now);
        if (unit === 'minute') {
            d.setHours(9, 30 + Math.round((idx / (n-1)) * 390), 0, 0);
            return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }

        if (unit === 'hour') {
            d.setDate(d.getDate() - Math.floor((n - 1 - idx) / 13));
            return d.toLocaleDateString('en-US', { weekday: 'short' });
        }

        if (unit === 'day') {
            d.setDate(d.getDate() - (n - 1 - idx));
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        d.setMonth(d.getMonth() - (n - 1 - idx));
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }

    function getChart(symbol, timeframe) {
        const sym = symbol.toUpperCase();
        const tf = TIMEFRAMES[timeframe] || TIMEFRAMES['1M'];
        const stock = getStock(sym);
        const rng = rngFor(sym + ':chart:' + timeframe);
        const volMap = { minute: 0.0016, hour: 0.006, day: 0.014, month: 0.05};
        const walk = buildWalk(rng, tf.points, volMap[tf.unit]);

        // Make it so series ends at current level price
        // Keep generated shape
        const rawStart = walk[0], rawEnd = walk[walk.length - 1];
        const priceStartGuess = stock.price / (1 + (rng() - 0.45) * (tf.unit === 'minute' ? 0.01 : tf.unit === 'month' ? 0.9 : 0.22));
        const prices = walk.map((v, i) => {
            const t = i / (walk.length - 1);
            const shapeVal = rawStart === rawEnd ? v : (v - rawStart) / (rawEnd - rawStart);
            const base = priceStartGuess + (stock.price - priceStartGuess) * t;
            const wiggle = (shapeVal - t) * stock.price * 0.18;
            return round2(Math.max(0.5, base + wiggle));
        });
        prices[prices.length - 1] = stock.price;

        const now = new Date();
        const labels = prices.map((_, i) => labelFor(tf.unit, i, prices.length, now));
        const volumes = prices.map(() => Math.floor(rng() * stock.avgVolume * 1.4 + stock.avgVolume * 0.3));

        return { symbol: sym, timeframe, labels, prices, volumes, isIntraday: tf.unit === 'minute'};
    }

    // conpany overview
    function getCompanyOverview(symbol) {
        const s = getStock(symbol);
        const descTemplates = [
            `${s.name} operates in the ${s.industry.toLowerCase()} space within the broader ${s.sector.toLowerCase()} sector, serving customers worldwide with a focus on product quality and long-term growth.`,
            `Headquartered in ${s.hq}, ${s.name} designs, builds, and distributes offerings across the ${s.industry.toLowerCase()} category, competing on innovation and scale.`,
            `${s.name} is a ${s.sector.toLowerCase()} company best known for its work in ${s.industry.toLowerCase()}, with operations spanning multiple global markets.`
        ];
        const rng = rngFor(symbol + ':desc');
        return {
            description: pick(rng, descTemplates),
            sector: s.sector,
            industry: s.industry,
            ceo: s.ceo,
            hq: s.hq,
            employees: s.employees,
            website: s.website
        }
    }

    // Stats
    function getStatistics(symbol) {
        const s = getStock(symbol);
        return {
            open: s.open, 
            prevClose: s.prevClose, 
            dayHigh: s.dayHigh, 
            dayLow: s.dayLow,
            week52High: 
            s.week52High, 
            week52Low: s.week52Low, 
            marketCap: s.marketCap,
            volume: s.volume, 
            avgVolume: s.avgVolume, 
            peRatio: s.peRatio, 
            eps: s.eps,
            dividendYield: s.dividendYield, 
            beta: s.beta
        };
    }

    // News
    function getNews(symbol) {
        const s = getStock(symbol);
        const rng = rngFor(symbol + ':news');
        const sources = ['MarkerPulse', 'Ledger Daily', 'StreetWire', 'Capital Desk', 'Quarterly Brief'];
        const templates = [
            `${s.name} shares move after analysts revisit price targets`,
            `What ${s.symbol}'s latest guidance means for the ${s.sector.toLowerCase()} sector`,
            `${s.name} expands product lineup ahead of next earnings call`,
            `Institutional investors adjust ${s.symbol} positions this quarter`,
            `${s.name} outlines cost efficiency plan for the year ahead`,
            `A look at ${s.symbol}'s valuation versus sector peers`
        ];
        const count = 4 + Math.floor(rng() * 2);
        const items = [];
        for (let i = 0; i < count; i++) {
            const hoursAgo = Math.floor(rng() * 46) + 1;
            items.push({
                id: symbol + '-news-' + i,
                headline: templates[i % templates.length],
                source: pick(rng, sources),
                publishedAgo: hoursAgo < 24 ? hoursAgo + 'h ago' : Math.floor(hoursAgo / 24) + 'd ago',
                colorA: s.logoColors[0],
                colorB: s.logoColors[1]
            });
        }
        return items;
    } 

    // Finances
    function getFinancials(symbol) {
        const s = getStock(symbol);
        const rng = rngFor(symbol + ':fin');
        const quarters = ['Q3 \'24', 'Q4 \'24', 'Q1 \'25', 'Q2 \'25'];
        let revenue = s.marketCap / 1e6 * (0.05 + rng() * 0.03);
        const rows = quarters.map(q => {
            revenue *= (1 + (rng() - 0.35) * 0.09);
            const margin = 0.12 + rng() * 0.22;
            const netIncome = revenue * margin;
            return  {
                quarter: q,
                revenue: Math.round(revenue),
                netIncome: Math.round(netIncome),
                eps: round2(netIncome / (revenue / s.eps || 1) * 0.01 + s.eps * (0.8 + rng() * 0.4)),
                grossMargin: round2(margin * 100 + 20)
            };
        });
        return rows;
    }

    // History
    function getOrders(symbol) {
        const s = getStock(symbol);
        const rng = rngFor(symbol + ":orders");
        if (rng() < 0.22) return [];
        const count = 2 + Math.floor(rng() * 5);
        const orders = [];
        let cursor = new Date();
        for (let i = 0; i < count; i++) {
            cursor = new Date(cursor.getTime() - (rng() * 9 + 1) * 86400000);
            const side = rng() > 0.35 ? 'buy' : 'sell';
            const shares = Math.floor(rng() * 40) + 1;
            const price = round2(s.price * (0.85 + rng() * 0.3));
            orders.push({
                id: symbol + '-ord' + i, side, shares, price,
                total: round2(shares * price),
                date: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                time: cursor.toLocaleTimeString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            });
        }
        return orders;
    }

    // Position 
    function getPosition(symbol) {
        const s = getStock(symbol);
        const rng = rngFor(symbol + ':position');
        if (rng() < 0.3) return null;
        const shares = round2(rng() * 60 + 1);
        const avgCost = round2(s.price * (0.78 + rng() * 0.35));
        const totalInvested = round2(shares * avgCost);
        const currentValue = round2(shares * s.price);
        const unrealizedPL = round2(currentValue - totalInvested);
        return {
            shares, avgCost, totalInvested, currentValue, unrealizedPL,
            unrealizedPLPercent: round2((unrealizedPL / totalInvested) * 100),
            todayReturn: round2(rng() * 22 + 2)
        };
    }

    // Account
    function getAccount() {
        return { buyingPower: 8420.55, cashRemaining: 8420.55}; // Cause why not
    }

    // Related Stocks
    function getRelatedStocks(symbol) {
        const sym = symbol.toUpperCase();
        const pool = SYMBOL_LIST.filter(s => s !== sym);
        const rng = rngFor(sym + ':related');
        const picked = [];
        const poolCopy = [...pool];
        for (let i = 0; i < 4 && poolCopy.length; i++) {
            const idx = Math.floor(rng() * poolCopy.length);
            picked.push(poolCopy.splice(idx, 1)[0]);
        }
        return picked.map(s => {
            const q = getStock(s);
            return { 
                symbol: q.symbol, 
                name: q.name, 
                price: q.price, 
                changePercent: q.changePercent, 
                colors: q.logoColors 
            };
        });
    }

    // Search
    function searchSymbols(query) {
        const q = query.trim().toUpperCase();
        if (!q) return [];
        return SYMBOL_LIST
            .filter(s => s.includes(q) || COMPANIES[s].name.toUpperCase().includes(q))
            .slice(0, 6)
            .map(s => ({ symbol: s, name: COMPANIES[s].name, colors: COMPANIES[s].colors, price: getStock(s).price, changePercent: getStock(s).changePercent }));
    }

    function popularSymbols(limit) {
        return SYMBOL_LIST.slice(0, limit || 5).map(s => {
            const q = getStock(s);
            return { 
                symbol: s, 
                name: COMPANIES[s].name, 
                colors: COMPANIES[s].colors, 
                price: q.price, 
                changePercent: q.changePercent 
            };
        });
    }

    window.MockData = {
        getStock,
        tickStock,
        getChart,
        getCompanyOverview,
        getStatistics,
        getNews,
        getFinancials,
        getOrders,
        getPosition,
        getAccount,
        getRelatedStocks,
        searchSymbols,
        popularSymbols,
        SYMBOL_LIST,
        marketStatus
    };
})();