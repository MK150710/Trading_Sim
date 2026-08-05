(function () {
    'use strict';

    const API = {

        async getStock(symbol) {
            const response = await fetch(`/stock/${symbol}/data/header`);

            if (!response.ok) {
                throw new Error("Failed to fetch stock header.");
            }

            const stock = await response.json();
            stock.lastUpdated = new Date(stock.lastUpdated);

            return stock;
        },

        async getChart(symbol, timeframe) {
            const response = await fetch(`/stock/${symbol}/data/chart?range=${timeframe}`);

            if (!response.ok) {
                throw new Error("Failed to fetch chart.");
            }

            return await response.json();
        },

        async getCompanyOverview(symbol) {
            const response = await fetch(`/stock/${symbol}/data/about`);

            if (!response.ok) {
                throw new Error("Failed to fetch company overview.");
            }

            return await response.json();
        },

        async getStatistics(symbol) {
            const response = await fetch(`/stock/${symbol}/data/stats`);

            if (!response.ok) {
                throw new Error("Failed to fetch company overview.");
            }

            return await response.json();
        },

        async getNews(symbol) {
            const response = await fetch(`/stock/${symbol}/data/news`);

            if (!response.ok) {
                throw new Error("Failed to fetch company overview.");
            }

            return await response.json();
        },

        async getFinancials(symbol) {
            const response = await fetch(`/stock/${symbol}/data/financials`);

            if (!response.ok) {
                throw new Error("Failed to fetch company finances.");
            }

            return await response.json();
        },

        async getOrders(symbol) {
            const response = await fetch(`/stock/${symbol}/data/order_hist`);

            if (!response.ok) {
                throw new Error("Failed to fetch chart.");
            }

            return await response.json();
        },

        async getPosition(symbol) {
            const response = await fetch(`/stock/${symbol}/data/position`);

            if (!response.ok) {
                throw new Error("Failed to fetch company overview.");
            }

            return await response.json();
        },

        async getAccount() {
            return window.MockData.getAccount();
        },

        async getRelatedStocks(symbol) {
            return window.MockData.getRelatedStocks(symbol);
        },

        async searchSymbols(query) {
            return window.MockData.searchSymbols(query);
        },

        async popularSymbols(limit) {
            return window.MockData.popularSymbols(limit);
        },

        async tickStock(symbol) {
            return window.MockData.tickStock(symbol);
        }
    };

    window.API = API;

})();