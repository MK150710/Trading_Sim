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
                <div class="ts-search__price">
                <div class="tabular">$${item.price.toFixed(2)}</div>
                <div class="tabular ${cls}" style="font-size:11px">${sign}${chg.toFixed(2)}%</div>
                </div>
            </div>`;
    }

    function initSearch({ input, panel, onSelect }) {
        let activeIndex = -1;
        let currentItems = [];

        function render(items, groupLabel) {
            currentItems = items;
            activeIndex = -1;
            if (!items.length) {
                panel.innerHTML = `<div class="ts-empty" style="padding:24px 8px">
                <div class="title">No matches</div>
                <div class="sub">Try a different symbol or company name.</div>
                </div>`;
                return;
            }
            panel.innerHTML = `<div class="ts-search__group-label">${groupLabel}</div>` + items.map(resultRow).join('');
            panel.querySelectorAll('.ts-search__result').forEach(el => {
                el.addEventListener('click', () => select(el.dataset.symbol));
            });
        }

        function renderDefault() {
            const recent = getRecent();
            let html = '';
            if (recent.length) {
                html += `<div class="ts-search__group-label">Recent</div>` +
                recent.map(sym => resultRow(window.MockData.searchSymbols(sym)[0] || window.MockData.popularSymbols(1)[0])).join('');
            }
            html += `<div class="ts-search__group-label">Popular</div>` +
                window.MockData.popularSymbols(5).map(resultRow).join('');
            panel.innerHTML = html;
            currentItems = [...RECENT_KEY(recent.map(s => ({ symbol: s })).filter(x => x)), ...window.MockData.popularSymbols(5)];
            panel.querySelectorAll('.ts-search-result').forEach(el => {
                el.addEventListener('click', () => select(el.dataset.symbol));
            });
            activeIndex = -1;
        }

        function select(symbol) {
            pushRecent(symbol);
            close();
            input.value = '';
            onSelect(symbol)
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
            render(window.MockData.searchSymbols(q), 'Results');
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