(function () {
    'use strict';

    const state = { symbol: 'AAPL', timeframe: '1D', chart: null, liveTimer: null};

    function symbolFromLocation() {
        const m = window.location.pathname.match(/\/stock\/([A-Za-z.]{1,6})/);
        if (m) return m[1].toUpperCase();
        const q = new URLSearchParams(window.location.search).get('symbol');
        if (q) return q.toUpperCase();
        return 'AAPL';
    }

    function showAllSkeletons() {
        ['header', 'chart', 'stats', 'overview', 'trade', 'position', 'related', 'news', 'financials', 'orders'].forEach(k => {
            const sk = document.getElementById(k + '-skeleton');
            const content = document.getElementById(k + '-content');
            if (sk) { sk.style.display = ''; sk.classList.remove('sk-swap-out'); }
            if (content) { content.style.display = 'none'; content.classList.remove('sk-swap-in'); }
        });
    }

    function renderChartRangeSummary(series) {
        const first = series.prices[0], last = series.prices[series.prices.length - 1];
        const change = last - first;
        const pct = (change / first ) * 100;
        const high = Math.max(...series.prices), low = Math.min(...series.prices);
        const cls = change >= 0 ? 'text-gain' : 'text-loss';
        document.getElementById('chart-range-summary').innerHTML = `
            <div class="item">Period Change<b class="tabular ${cls}">${TSFormat.sign(change)}${change.toFixed(2)} (${TSFormat.pct(pct)})</b></div>
            <div class="item">Period High<b class="tabular">${TSFormat.money(high)}</b></div>
            <div class="item">Period Low<b class="tabular">${TSFormat.money(low)}</b></div>
        `;
    }

    function revealChartSection() {
        const sk = document.getElementById('chart-skeleton');
        const content = document.getElementById('chart-content');
        if (content.style.display === 'none') {
            sk.classList.add('sk-swap-out');
            setTimeout(() => { sk.style.display = 'none'; }, 200);
            content.style.display = '';
            content.classList.add('sk-swap-in');
        }
    }

    function loadChart(symbol, timeframe, animate) {
        revealChartSection();
        const series = window.MockData.getChart(symbol, timeframe);
        if (!state.chart) {
            state.chart = new StockChart(document.getElementById('chart-canvas'), document.getElementById('chart-tooltip'));
        } else {
            state.chart._resize();
        }
        state.chart.setData(series.labels, series.prices, { animate });
        renderChartRangeSummary(series);
    }

    function wireTimeframes(symbol) {
        document.querySelectorAll('.ts-timeframes button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.ts-timeframes button').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                state.timeframe = btn.dataset.tf;
                loadChart(state.symbol, state.timeframe, true);
            });
        });
    }

    function wireFinancialsTabs() {
        document.querySelectorAll('.ts-fin-tabs button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.ts-fin-tabs button').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                window.TSUI.renderFinancialBars(btn.dataset.metric);
            });
        });
    }

    function wireOrderType() {
        const sel = document.getElementById('trade-order-type');
        const limitField = document.getElementById('trade-limit-field');
        sel.addEventListener('change', () => {
            limitField.style.display = sel.value === 'limit' ? '' : 'none';
        });
    }

    function startLiveTicker() {
        clearInterval(state.liveTimer);
        state.liveTimer = setInterval(() => {
            const prev = window.MockData.getStock(state.symbol).price;
            const stock = window.MockData.tickStock(state.symbol);
            const up = stock.price >= prev;
            TSUI.renderHeader(stock);
            TSUI.flashPrice(document.getElementById('header-price'), up);
            TSUI.renderTradePanel(stock, window.MockData.getAccount());
            TSUI.flashPrice(document.getElementById('trade-price'), up);
        }, 2600);
    }

    function goToSymbol(symbol) {
        symbol = symbol.toUpperCase();
        window.history.pushState({}, '', `/stock/${symbol}`);
        loadSymbol(symbol, true);
    }
    window.addEventListener('popstate', () => loadSymbol(symbolFromLocation(), false));

    function loadSymbol(symbol, showLoading) {
        state.symbol = symbol;
        if (showLoading) showAllSkeletons();

        const render = () => {
            const stock = window.MockData.getStock(symbol);
            const account = window.MockData.getAccount();

            TSUI.renderHeader(stock);
            loadChart(symbol, state.timeframe, false);
            TSUI.renderStats(window.MockData.getStatistics(symbol));
            TSUI.renderOverview(window.MockData.getCompanyOverview(symbol));
            TSUI.renderTradePanel(stock, account);
            TSUI.renderPosition(window.MockData.getPosition(symbol));
            TSUI.renderRelated(window.MockData.getRelatedStocks(symbol), goToSymbol); 
            TSUI.renderNews(window.MockData.getNews(symbol));
            TSUI.renderFinancials(window.MockData.getFinancials(symbol));
            TSUI.renderOrders(window.MockData.getOrders(symbol));
            TSUI.initWatchlist(symbol);

            TSUI.wireTradePanel(
                () => window.MockData.getStock(state.symbol),
                () => window.MockData.getAccount(),
                ({ side, qty, stock}) => {
                    TSUI.toast(`${side === 'buy' ? 'Bought' : 'Sold'} ${qty} share${qty === 1 ? '' : 's'} of ${stock.symbol} (simulated)`);
                }
            );

            window.TSAnim.observeReveal('.reveal');
            startLiveTicker();
        };

        if (showLoading) {
            setTimeout(render, 850);
        } else {
            render();
        }
    }

    function init() {
        window.TSTheme.initTheme();
        document.getElementById('theme-toggle').addEventListener('click', () => window.TSTheme.toggleTheme());
        
        window.TSSearch.initSearch({
            input: document.getElementById('search-input'),
            panel: document.getElementById('search-panel'),
            onSelect: goToSymbol
        });

        wireTimeframes();
        wireOrderType();
        wireFinancialsTabs();

        const initialSymbol = symbolFromLocation();
        if (!window.location.pathname.startsWith('/stock/')) {
            window.history.replaceState({}, '', `/stock/${initialSymbol}`);
        }
        loadSymbol(initialSymbol, true);
    }

    document.addEventListener('DOMContentLoaded', init);
})();