(function () {
    'use strict';

    const state = {
        symbol: 'AAPL',
        timeframe: '1D',
        chart: null,
        liveTimer: null,
        stock: null,
        account: null
    };

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

    function renderChartRangeSummary(stats) {
        const cls = stats.change >= 0 ? 'text-gain' : 'text-loss';

        document.getElementById('chart-range-summary').innerHTML = `
            <div class="item">
                Period Change
                <b class="tabular ${cls}">
                    ${TSFormat.sign(stats.change)}
                    ${stats.change.toFixed(2)}
                    (${TSFormat.pct(stats.changePercent)})
                </b>
            </div>
            <div class="item">
                Period High
                <b class="tabular">
                    ${TSFormat.money(stats.high)}
                </b>
            </div>
            <div class="item">
                Period Low
                <b class="tabular">
                    ${TSFormat.money(stats.low)}
                </b>
            </div>
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

    async function loadChart(symbol, timeframe) {
        revealChartSection();
        const series = await API.getChart(symbol, timeframe);
        if (!state.chart) {
            state.chart = new StockChart(
                document.getElementById("chart-canvas")
            );
        }
        state.chart.setData(series.candles);
        renderChartRangeSummary(series.stats);
    }

    function wireTimeframes(symbol) {
        document.querySelectorAll('.ts-timeframes button').forEach(btn => {
            btn.addEventListener('click', async () => {
                document.querySelectorAll('.ts-timeframes button').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                state.timeframe = btn.dataset.tf;
                await loadChart(state.symbol, state.timeframe);
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


    async function goToSymbol(symbol) {
        symbol = symbol.toUpperCase();
        window.history.pushState({}, '', `/stock/${symbol}`);
        await loadSymbol(symbol, true);
    }
    window.addEventListener('popstate', async () => await loadSymbol(symbolFromLocation(), false));

    async function loadSymbol(symbol, showLoading) {
        state.symbol = symbol;
        if (showLoading) showAllSkeletons();

        const render = async () => {
            const stock = await API.getStock(symbol);
            const account = await API.getAccount(symbol);

            state.stock = stock;
            state.account = account;

            TSUI.renderHeader(stock);
            await loadChart(symbol, state.timeframe);
            TSUI.renderStats(await API.getStatistics(symbol));
            TSUI.renderOverview(await API.getCompanyOverview(symbol));
            TSUI.renderTradePanel(stock, account);
            TSUI.renderPosition(await API.getPosition(symbol));
            TSUI.renderRelated(await API.getRelatedStocks(symbol), goToSymbol); 
            TSUI.renderNews(await API.getNews(symbol));
            TSUI.renderFinancials(await API.getFinancials(symbol));
            TSUI.renderOrders(await API.getOrders(symbol));
            TSUI.initWatchlist(symbol);

            TSUI.wireTradePanel(
                () => state.stock,
                () => state.account,
                async ({side, qty, stock}) => {
                    const response = await fetch('/stock/data/trade', {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': window.csrfToken
                        },
                        body: JSON.stringify({
                            side: side,
                            quantity: qty,
                            stock: stock.symbol
                        })
                    });
                    const data = await response.json();
                    TSUI.toast(
                        `${side === 'buy' ? 'Bought' : 'Sold'} ${qty} share${qty === 1 ? '' : 's'} of ${stock.symbol}`
                    );
                }
            );

        };  

        if (showLoading) {
            setTimeout(render, 850);
        } else {
            render();
        }
    }

    async function init() {
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

        
        window.TSAnim.observeReveal('.reveal');
        await loadSymbol(initialSymbol, true);
    }

    document.addEventListener('DOMContentLoaded', init);
})();