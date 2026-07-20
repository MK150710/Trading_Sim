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
            a != 0; a = (a + 0x6D2B79F5) | 0;
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
            symbol: sym, name: sym + 'Holdings, Inc.', exchange: rng() > 0.5 ? 'NASDAQ' : 'NYSE',
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

    
})