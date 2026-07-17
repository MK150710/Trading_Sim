const REQUEST_TIMEOUT_MS = 4000;

/* ============================================================================
 * Fetch Helper
 * ========================================================================== */

async function fetchJSON(url, { timeout = REQUEST_TIMEOUT_MS } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Request failed (${response.status})`);
        }

        return await response.json();
    } finally {
        clearTimeout(timer);
    }
}

/* ============================================================================
 * Stock API
 * ========================================================================== */

export class StockAPI {
    constructor(baseUrl = "") {
        this.baseUrl = baseUrl;
    }

    async search(query) {
        if (!query.trim()) return [];
        return fetchJSON(
            `${this.baseUrl}/api/search?q=${encodeURIComponent(query)}`
        );
    }

    async getQuote(symbol) {
        return fetchJSON(
            `${this.baseUrl}/api/quote/${encodeURIComponent(symbol)}`
        );
    }

    async getHistorical(symbol, range = "3M") {
        return fetchJSON(
            `${this.baseUrl}/api/history/${encodeURIComponent(symbol)}?range=${range}`
        );
    }

    async getTrending() {
        return fetchJSON(
            `${this.baseUrl}/api/trending`
        );
    }

    async getMarketOverview() {
        return fetchJSON(
            `${this.baseUrl}/api/market`
        );
    }

    async getMovers() {
        return fetchJSON(
            `${this.baseUrl}/api/movers`
        );
    }

    async getWatchlist() {
        return fetchJSON(
            `${this.baseUrl}/api/watchlist`
        );
    }

    async getPortfolio() {
        return fetchJSON(
            `${this.baseUrl}/api/portfolio`
        );
    }

    async getPortfolioHistory(range = "3M") {
        return fetchJSON(
            `${this.baseUrl}/api/portfolio/history?range=${range}`
        );
    }

    async getTransactions() {
        return fetchJSON(
            `${this.baseUrl}/api/transactions`
        );
    }

    async getNews() {
        return fetchJSON(
            `${this.baseUrl}/api/news`
        );
    }
}

export const stockAPI = new StockAPI();