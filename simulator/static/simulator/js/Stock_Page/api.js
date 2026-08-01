(function () {
    'use strict';

    const API = {

        async getStock(symbol) {
            return window.MockData.getStock(symbol);
        },

        async getChart(symbol, timeframe) {
            return window.MockData.getChart(symbol, timeframe);
        },

        async getCompanyOverview(symbol) {
            return window.MockData.getCompanyOverview(symbol);
        },

        async getStatistics(symbol) {
            return window.MockData.getStatistics(symbol);
        },

        async getNews(symbol) {
            return window.MockData.getNews(symbol);
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