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
            return window.MockData.getChart(symbol, timeframe);
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
            return window.MockData.getFinancials(symbol);
        },

        async getOrders(symbol) {
            return window.MockData.getOrders(symbol);
        },

        async getPosition(symbol) {
            return window.MockData.getPosition(symbol);
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