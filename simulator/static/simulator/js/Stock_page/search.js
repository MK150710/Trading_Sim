(function () {
    'use strict';
    const RECENT_KEY = 'tradesims:recentSearches';
    
    function getRecent() {
        try {return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (e) {return []; }
    }
    function pushRecent(symbol) {
        const list = getRecent().filter(s => s !== symbol);
        list.unshift(symbol);
        localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
    }

    function logoStyle(colors) {
        return `background: linear-gradient(135deg, ${colors[0]}, ${colors[1]});`;
    }

    function resultRow(item) {
        const chg = item.changePercent;
        const cls = chg >= 0 ? 'text-gain' : 'text-loss';
        const sign = chg >= 0 ? '+' : '';
        return `
            <div class="ts-search__result" data-symbol="${item.symbol}" role="option">
                <div class="ts-search__logo" style="${logoStyle(item.colors)}">${item.symbol.slice(0, 2)}</div>
                <div class="ts-search__meta">
                <div class="name">${item.symbol}</div>
                <div class="sub">${item.name}</div>
                </div>  
            </div>`;
    }

    
    const LOGO_COLORS = [
        ["#6366F1", "#3B82F6"],
        ["#10B981", "#059669"],
        ["#F59E0B", "#EA580C"],
        ["#EF4444", "#DC2626"],
        ["#8B5CF6", "#EC4899"],
        ["#06B6D4", "#0891B2"],
    ];

    function getLogoColors(symbol) {
        let hash = 0;

        for (const ch of symbol) {
            hash += ch.charCodeAt(0);
        }

        return LOGO_COLORS[hash % LOGO_COLORS.length];
    }

    function searchSymbols(query) {
        const q = query.trim().toUpperCase();

        if (!q) return [];

        return window.TOP_STOCKS
            .filter(symbol => symbol.includes(q))
            .slice(0, 6)
            .map(symbol => ({
                symbol,
                name: symbol,
                price: 0,
                changePercent: 0,
                colors: getLogoColors(symbol)
            }));
    }
    function initSearch({ input, panel, onSelect }) {
        let activeIndex = -1;
        let currentItems = [];

        function render(items, groupLabel) {
            currentItems = items;
            activeIndex = -1;
            if (!items.length) {
                panel.innerHTML = `
                    <div class="ts-empty" style="padding:24px 8px">
                        <div class="title">Stock not currently supported</div>
                        <div class="sub">
                            Enter the exact symbol to check if it's available.
                        </div>
                        <form class="ts-stock-discover-form" method="POST" action="/stock/discover">
                            <input type="hidden" name="csrfmiddlewaretoken" value="${window.csrfToken}">
                            <input type="text" name="symbol" placeholder="Enter exact symbol" maxlength="10" required>
                            <button type="submit">Check Stock</button>
                        </form>
                    </div>
                `;
                return;
            }
            panel.innerHTML = `<div class="ts-search__group-label">${groupLabel}</div>` + items.map(resultRow).join('');
            panel.querySelectorAll('.ts-search__result').forEach(el => {
                el.addEventListener('click', () => select(el.dataset.symbol));
            });
        }
        function renderDefault() {
            const recent = getRecent()
                .filter(symbol => window.TOP_STOCKS.includes(symbol))
                .map(symbol => ({
                    symbol,
                    name: symbol,
                    price: 0,
                    changePercent: 0,
                    colors: getLogoColors(symbol)
                }));

            const popular = window.TOP_STOCKS
                .slice(0, 5)
                .map(symbol => ({
                    symbol,
                    name: symbol,
                    price: 0,
                    changePercent: 0,
                    colors: getLogoColors(symbol)
                }));

            let html = "";

            if (recent.length) {
                html += `<div class="ts-search__group-label">Recent</div>`;
                html += recent.map(resultRow).join("");
            }

            html += `<div class="ts-search__group-label">Popular</div>`;
            html += popular.map(resultRow).join("");

            panel.innerHTML = html;
            currentItems = [...recent, ...popular];

            panel.querySelectorAll(".ts-search__result").forEach(el => {
                el.addEventListener("click", () => select(el.dataset.symbol));
            });

            activeIndex = -1;
        }
        function select(symbol) {
            pushRecent(symbol);
            close();
            input.value = '';
            onSelect(symbol);
        }

        function open() { panel.classList.add('is-open'); input.setAttribute('aria-expanded', 'true'); }
        function close() { panel.classList.remove('is-open'); input.setAttribute('aria-expanded', 'false'); }
        
        input.addEventListener('focus', () => {
            if (!input.value.trim()) renderDefault();
            open();
        });
        input.addEventListener('input', () => {
            const q = input.value.trim();
            if (!q) { renderDefault(); return; }
            render(searchSymbols(q), 'Results');
        });
        input.addEventListener('keydown', (e) => {
            const rows = () => Array.from(panel.querySelectorAll('.ts-search__result'));
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex = Math.min(activeIndex + 1, rows().length - 1);
                rows().forEach((r, i) => r.classList.toggle('is-active', i === activeIndex));
                rows()[activeIndex]?.scrollIntoView({ block: 'nearest'});
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, 0);
                rows().forEach((r, i) => r.classList.toggle('is-active', i === activeIndex));
            } else if (e.key === 'Enter') {
                const r = rows()[activeIndex] || rows()[0];
                if (r) select(r.dataset.symbol);
            } else if (e.key === 'Escape') {
                close(); input.blur();
            }
        });
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && (e.target) !== input) close();
        });
        document.addEventListener('keydown', (e) => {
            if ((e.key === '/' || (e.metaKey && e.key === 'k')) && document.activeElement !== input) {
                e.preventDefault();
                input.focus();
            }
        });

        return { select, pushRecent };
    }

    window.TSSearch = { initSearch, pushRecent, getRecent };
})();