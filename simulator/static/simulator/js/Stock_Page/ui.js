(function () {
    'use strict';
    const $ = sel => document.querySelector(sel);
    const fmt = {
        money(n, digits = 2) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }); },
        compact(n) { return '$' + Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2}).format(n); },
        num(n) { return n.toLocaleString('en-US'); },
        sign(n) { return n >= 0 ? '+' : ''; },
        pct(n) { return this.sign(n) + n.toFixed(2) + '%'; }
    };
    window.TSFormat = fmt;

    function logoGrad(colors) { return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`; }
    function initials(symbol) { return symbol.slice(0, 2); }

    function crossfadeIn(skeletonEl, contentEl) {
        if (skeletonEl) { skeletonEl.classList.add('sk-swap-out'); setTimeout(() => skeletonEl.style.display = 'none', 200); }
        if (contentEl) { contentEl.style.display = ''; contentEl.classList.add('sk-swap-in'); }
    }

    // Header 
    function renderHeader(stock) {
        const up = stock.change >= 0;
        $('#stock-logo').style.background = logoGrad(stock.logoColors);
        $('#stock-logo').textContent = initials(stock.symbol);
        $('#stock-name').textContent = stock.name;
        $('#stock-symbol-exchange').textContent = `${stock.symbol} · ${stock.exchange}`;
        $('#breadcrumb-symbol').textContent = stock.symbol;

        const statusEl = $('#market-status');
        const statusMap = {
        open: ['badge-live', '<span class="dot"></span> Market open'],
        extended: ['badge-neutral', 'Extended hours'],
        closed: ['badge-closed', '<span class="dot"></span> Market closed']
        };
        const [cls, label] = statusMap[stock.marketStatus] || statusMap.closed;
        statusEl.className = 'badge ' + cls;
        statusEl.innerHTML = label;

        $('#header-price').textContent = fmt.money(stock.price);
        const deltaEl = $('#header-delta');
        deltaEl.className = 'ts-price-block__delta ' + (up ? 'text-gain' : 'text-loss');
        deltaEl.innerHTML = `<span>${up ? '▲' : '▼'}</span><span>${fmt.sign(stock.change)}${stock.change.toFixed(2)} (${fmt.pct(stock.changePercent)})</span>`;
        $('#header-updated').textContent = 'As of ' + stock.lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });

        crossfadeIn($('#header-skeleton'), $('#header-content'));
    }

    function flashPrice(el, up) {
        el.classList.remove('flash-up', 'flash-down');
        void el.offsetWidth;
        el.classList.add(up ? 'flash-up' : 'flash-down');
    }

    // Stats    
    function renderStats(stats) {
        const rows = [
            ['Open', fmt.money(stats.open)], ['Prev. Close', fmt.money(stats.prevClose)],
            ['Day High', fmt.money(stats.dayHigh)], ['Day Low', fmt.money(stats.dayLow)],
            ['52W High', fmt.money(stats.week52High)], ['52W Low', fmt.money(stats.week52Low)],
            ['Market Cap', fmt.compact(stats.marketCap)], ['Volume', fmt.num(stats.volume)],
            ['Avg. Volume', fmt.num(stats.avgVolume)], ['P/E Ratio', stats.peRatio.toFixed(2)],
            ['EPS', fmt.money(stats.eps)], ['Div. Yield', stats.dividendYield ? stats.dividendYield.toFixed(2) + '%' : '—'],
            ['Beta', stats.beta.toFixed(2)]
        ];
        $('#stats-grid').innerHTML = rows.map(([label, value]) => `
            <div class="ts-stat-item">
                <div class="label">${label}</div>
                <div class="value tabular">${value}</div>
            </div>`).join('');
        crossfadeIn($('#stats-skeleton'), $('#stats-content'));
    }

    // Company Overview
    function renderOverview(ov) {
        $('#overview-desc').textContent = ov.description;
        const items = [
            ['Sector', ov.sector], 
            ['Industry', ov.industry], 
            ['CEO', ov.ceo],
            ['Headquarters', ov.hq], 
            ['Employees', ov.employees], 
            ['Website', ov.website]
        ];
        $('#overview-grid').innerHTML = items.map(([label, value]) => `
            <div class="ts-overview-item">
                <div class="label">${label}</div>
                <div class="value">${value}</div>
            </div>`).join('');
        crossfadeIn($('#overview-skeleton'), $('#overview-content'));
    }

    // Trading panel
    const tradeState = { side: 'buy', qty: 1 };

    function updateTradeSummary(stock, account) {
        const est = round2(stock.price * tradeState.qty);
        $('#trade-est-cost').textContent = fmt.money(est);
        $('#trade-buying-power').textContent = fmt.money(account.buyingPower);
        $('#trade-cash-remaining').textContent = fmt.money(round2(account.buyingPower - (tradeState.side === 'buy' ? est : 0)));
        const err = $('#trade-error');
        const invalid = tradeState.side === 'buy' && est > account.buyingPower;
        err.classList.toggle('is-visible', invalid);
        if (invalid) err.textContent = 'Estimated cost exceeds available buying power.';
        $('#trade-submit').disabled = invalid || tradeState.qty <= 0;
        $('#trade-submit').textContent = (tradeState.side === 'buy' ? 'Buy ' : 'Sell ') + stock.symbol;
        $('#trade-submit').className = 'btn ' + (tradeState.side === 'buy' ? 'btn-buy' : 'btn-sell');
    }
    function round2(n) { return Math.round(n * 100) / 100; }

    function renderTradePanel(stock, account) {
        $('#trade-price').textContent = fmt.money(stock.price);
        $('#trade-qty-input').value = tradeState.qty;
        $('#seg-buy').classList.toggle('is-active', tradeState.side === 'buy');
        $('#seg-sell').classList.toggle('is-active', tradeState.side === 'sell');
        updateTradeSummary(stock, account);
        crossfadeIn($('#trade-skeleton'), $('#trade-content'));
    }

    function wireTradePanel(getStock, getAccount, onSubmit) {
        $('#seg-buy').addEventListener('click', () => { tradeState.side = 'buy'; renderTradePanel(getStock(), getAccount()); });
        $('#seg-sell').addEventListener('click', () => { tradeState.side = 'sell'; renderTradePanel(getStock(), getAccount()); });
        $('#trade-qty-minus').addEventListener('click', () => { tradeState.qty = Math.max(1, tradeState.qty - 1); renderTradePanel(getStock(), getAccount()); });
        $('#trade-qty-plus').addEventListener('click', () => { tradeState.qty = tradeState.qty + 1; renderTradePanel(getStock(), getAccount()); });
        $('#trade-qty-input').addEventListener('input', (e) => {
            const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
            tradeState.qty = v; updateTradeSummary(getStock(), getAccount());
        });
        $('#trade-submit').addEventListener('click', () => {
            if ($('#trade-submit').disabled) return;
            onSubmit({ ...tradeState, stock: getStock() });
        });
    }

    // Position
    function renderPosition(position) {
        const wrap = $('#position-card-body');
        if (!position) {
            wrap.innerHTML = `
                <div class="ts-empty">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v18h18M7 15l4-5 3 3 5-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <div class="title">No holdings yet</div>
                    <div class="sub">Buy your first share to start tracking a position here.</div>
                </div>`;
            crossfadeIn($('#position-skeleton'), $('#position-content'));
            return;
        }
        const plUp = position.unrealizedPL >= 0;
        const todayUp = position.todayReturn >= 0;
        wrap.innerHTML = `
            <div class="ts-position-grid">
                <div><div class="label">Shares Owned</div><div class="value tabular">${position.shares}</div></div>
                <div><div class="label">Average Cost</div><div class="value tabular">${fmt.money(position.avgCost)}</div></div>
                <div><div class="label">Total Invested</div><div class="value tabular">${fmt.money(position.totalInvested)}</div></div>
                <div><div class="label">Current Value</div><div class="value tabular">${fmt.money(position.currentValue)}</div></div>
                <div><div class="label">Unrealized P/L</div><div class="value tabular ${plUp ? 'text-gain' : 'text-loss'}">${fmt.sign(position.unrealizedPL)}${fmt.money(Math.abs(position.unrealizedPL))} (${fmt.pct(position.unrealizedPLPercent)})</div></div>
                <div><div class="label">Today's Return</div><div class="value tabular ${todayUp ? 'text-gain' : 'text-loss'}">${fmt.sign(position.todayReturn)}${fmt.money(Math.abs(position.todayReturn))}</div></div>
            </div>
            <div>
                <div class="label" style="font-size:var(--fs-2xs);color:var(--color-text-tertiary)">Portfolio Allocation — ${position.allocationPercent.toFixed(1)}%</div>
                <div class="ts-alloc-bar"><div class="ts-alloc-bar__fill" style="width:${Math.min(100, position.allocationPercent)}%"></div></div>
            </div>`;
        crossfadeIn($('#position-skeleton'), $('#position-content'));
    }

    // Watchlist
    function initWatchlist(symbol, onChange) {
        const key = 'tradesims:watchlist';
        const btn = $('#watchlist-btn');
        const list = () => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; } };
        const save = (l) => localStorage.setItem(key, JSON.stringify(l));
        function refresh() {
            const active = list().includes(symbol);
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-pressed', String(active));
            btn.setAttribute('aria-label', active ? 'Remove from watchlist' : 'Add to watchlist');
        }
        btn.addEventListener('click', () => {
            const l = list();
            const idx = l.indexOf(symbol);
            if (idx >= 0) { l.splice(idx, 1); toast(`Removed ${symbol} from watchlist`); }
            else { l.push(symbol); toast(`Added ${symbol} to watchlist`); }
            save(l);
            btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
            refresh();
            if (onChange) onChange(l.includes(symbol));
        });
        refresh();
    }

    // Relates Stocks
    function renderRelated(list, onSelect) {
        const wrap = $('#related-list');
        wrap.innerHTML = list.map(s => `
            <div class="ts-related-item" data-symbol="${s.symbol}" tabindex="0" role="button">
                <div class="logo" style="background:${logoGrad(s.colors)}">${initials(s.symbol)}</div>
                <div>
                    <div class="sym">${s.symbol}</div>
                    <div class="nm">${s.name}</div>
                </div>
                <div>
                    <div class="px tabular">${fmt.money(s.price)}</div>
                    <div class="chg ${s.changePercent >= 0 ? 'text-gain' : 'text-loss'}" style="text-align:right">${fmt.pct(s.changePercent)}</div>
                </div>
            </div>`).join('');
        wrap.querySelectorAll('.ts-related-item').forEach(el => {
            const go = () => onSelect(el.dataset.symbol);
            el.addEventListener('click', go);
            el.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        });
        crossfadeIn($('#related-skeleton'), $('#related-content'));
    }

    // News
    function renderNews(items) {
        const wrap = $('#news-grid');
        if (!items.length) {
            wrap.innerHTML = `<div class="ts-empty" style="grid-column:1/-1">
                <div class="title">No recent news</div>
                <div class="sub">Check back later for updates on this stock.</div>
            </div>`;
        } else {
            wrap.innerHTML = items.map(n => `
                <div class="ts-news-card lift">
                    <div class="ts-news-card__thumb" style="background:linear-gradient(135deg, ${n.colorA}, ${n.colorB})"></div>
                    <div class="ts-news-card__body">
                        <div class="ts-news-card__headline">${n.headline}</div>
                        <div class="ts-news-card__meta"><span>${n.source}</span><span>·</span><span>${n.publishedAgo}</span></div>
                    </div>
                </div>`).join('');
        }
        crossfadeIn($('#news-skeleton'), $('#news-content'));
    }

    // Financials
    let financialRows = [];
    function renderFinancialBars(metric) {
        const key = metric === 'netIncome' ? 'netIncome' : 'revenue';
        const max = Math.max(...financialRows.map(r => r[key]));
        $('#fin-bars').innerHTML = financialRows.map(r => `
            <div class="ts-fin-bar-col">
                <div class="ts-fin-bar" style="height:${Math.max(6, (r[key] / max) * 100)}%" title="${fmt.compact(r[key])}"></div>
                <div class="lbl">${r.quarter}</div>
            </div>`).join('');
    }
    function renderFinancials(rows) {
        financialRows = rows;
        renderFinancialBars('revenue');
        $('#fin-table-body').innerHTML = rows.map(r => `
            <tr>
                <td>${r.quarter}</td>
                <td>${fmt.compact(r.revenue)}</td>
                <td>${fmt.compact(r.netIncome)}</td>
                <td>${fmt.money(r.eps)}</td>
                <td>${r.grossMargin.toFixed(1)}%</td>
            </tr>`).join('');
        crossfadeIn($('#financials-skeleton'), $('#financials-content'));
    }

    // Order history
    function renderOrders(orders) {
        const wrap = $('#orders-list');
        if (!orders.length) {
            wrap.innerHTML = `<div class="ts-empty">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 10h8M8 14h5" stroke-linecap="round"/></svg>
                <div class="title">No orders yet</div>
                <div class="sub">Your buy and sell activity for this stock will show up here.</div>
            </div>`;
        } else {
            wrap.innerHTML = orders.map(o => `
                <div class="ts-timeline-item">
                    <div class="ts-timeline-icon ${o.side}">${o.side === 'buy' ? '↑' : '↓'}</div>
                    <div class="ts-timeline-body">
                        <div class="action">${o.side === 'buy' ? 'Bought' : 'Sold'} ${o.shares} sh @ ${fmt.money(o.price)}</div>
                        <div class="meta">${o.time}</div>
                    </div>
                    <div class="ts-timeline-total tabular">${fmt.money(o.total)}<span class="date">${o.date}</span></div>
                </div>`).join('');
        }
        crossfadeIn($('#orders-skeleton'), $('#orders-content'));
    }

    // Toasts
    function toast(message, type = 'success') {
        const stack = $('#toast-stack');
        const el = document.createElement('div');
        el.className = 'ts-toast' + (type === 'error' ? ' error' : '');
        el.innerHTML = `<span class="dot"></span><span>${message}</span>`;
        stack.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 200ms'; setTimeout(() => el.remove(), 220); }, 2600);
    }

    window.TSUI = {
        renderHeader, 
        flashPrice, 
        renderStats, 
        renderOverview, 
        renderTradePanel, 
        wireTradePanel, 
        renderPosition, 
        initWatchlist, 
        renderRelated, 
        renderNews, 
        renderFinancials, 
        renderFinancialBars, 
        renderOrders, 
        toast, 
        updateTradeSummary, 
        tradeState
    };
})();