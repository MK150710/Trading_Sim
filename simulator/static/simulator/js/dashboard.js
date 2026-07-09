/**
 * dashboard.js
 * ---------------------------------------------------------------------------
 * Controller for dashboard.html. Wires StockAPI (api.js) to the DOM using
 * the shared chrome/formatting helpers in ui.js and the motion helpers in
 * animations.js. Nothing here defines new styles or markup patterns beyond
 * what components.css already describes — this file only ever fills
 * containers that already exist in the template.
 * ---------------------------------------------------------------------------
 */

import { StockAPI } from './api.js';
import {
  $, $$, escapeHTML, debounce,
  formatCurrency, formatSignedCurrency, formatPercent, formatCompactNumber,
  formatDate, timeAgo, sentiment, symbolColor, stockLogo, icon,
  skeletonCard, skeletonRows, renderEmpty, renderError,
  initSidebar, initDropdown, initClock, initGreeting,
} from './ui.js';
import { revealOnScroll, revealStagger, animateCount, flashValue, setSentiment } from './animations.js';

const api = new StockAPI();

/* ============================================================================
 * Small local helpers (sparklines + pills) — presentation glue that belongs
 * to this page, not to the generic ui.js toolkit.
 * ========================================================================== */

function sparklineSVG(points, isPositive, { width = 100, height = 32, strokeWidth = 1.75 } = {}) {
  if (!points || points.length < 2) return '';
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);
  const coords = points.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const colorVar = isPositive ? 'var(--bull)' : 'var(--bear)';
  return `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" width="100%" height="100%">
      <polyline points="${coords.join(' ')}" fill="none" stroke="${colorVar}"
        stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`;
}

function changePill(changePercent) {
  const dir = sentiment(changePercent);
  const cls = dir === 'up' ? 'pill--bull' : dir === 'down' ? 'pill--bear' : 'pill--neutral';
  const arrow = dir === 'down' ? icon('arrowDown') : icon('arrowUp');
  return `<span class="pill ${cls}">${dir === 'flat' ? '' : arrow}${formatPercent(changePercent)}</span>`;
}

function changeValueInline(changePercent) {
  const dir = sentiment(changePercent);
  const cls = dir === 'up' ? 'up' : dir === 'down' ? 'down' : 'flat';
  const arrow = dir === 'down' ? icon('arrowDown') : icon('arrowUp');
  return `<span class="change-value ${cls}">${dir === 'flat' ? '' : arrow}${formatPercent(changePercent)}</span>`;
}

/* ============================================================================
 * Chrome: icons, sidebar, clock, greeting, dropdowns
 * ========================================================================== */

function mountStaticIcons() {
  const map = {
    sidebarLogoMark: 'logoMark',
    navMenuBtn: 'menu',
    searchIcon: 'search',
    bellIcon: 'bell',
    profileChevron: 'chevronDown',
    heroEyebrowIcon: 'portfolio',
  };
  Object.entries(map).forEach(([id, name]) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = icon(name);
  });

  $$('.nav-item[data-icon]').forEach((el) => {
    const iconEl = $('.nav-item__icon', el);
    if (iconEl) iconEl.innerHTML = icon(el.dataset.icon);
  });

  const collapseIcon = $('.collapse-icon');
  if (collapseIcon) collapseIcon.innerHTML = icon('chevronLeft');
}

function initChrome() {
  mountStaticIcons();
  initSidebar();
  initClock();
  initGreeting();
  initDropdown('notifTrigger', 'notifPanel');
  initDropdown('profileTrigger', 'profilePanel');
}

/* ============================================================================
 * Hero
 * ========================================================================== */

async function renderHero() {
  try {
    const portfolio = await api.getPortfolio();
    const isUp = portfolio.todayChange >= 0;

    animateCount($('#heroTotalValue'), { to: portfolio.totalValue, formatter: (v) => formatCurrency(v) });

    const changeEl = $('#heroTodayChange');
    changeEl.textContent = formatSignedCurrency(portfolio.todayChange);
    changeEl.classList.add(isUp ? 'up' : 'down');

    const pctEl = $('#heroTodayChangePercent');
    pctEl.textContent = formatPercent(portfolio.todayChangePercent);
    pctEl.classList.add(isUp ? 'up' : 'down');

    $('#heroBuyingPower').textContent = formatCurrency(portfolio.buyingPower);

    setSentiment(isUp);
  } catch (err) {
    console.error('[dashboard] hero failed', err);
  }
}

/* ============================================================================
 * Market overview
 * ========================================================================== */

async function renderMarketOverview() {
  const container = $('#marketOverview');
  container.innerHTML = skeletonCard(3);
  try {
    const indices = await api.getMarketOverview();
    if (!indices.length) return renderEmpty(container, { title: 'No market data' });

    container.innerHTML = indices
      .map((idx) => {
        const isUp = idx.changePercent >= 0;
        return `
        <div class="card card--interactive overview-card reveal">
          <div class="overview-card__head">
            <div>
              <div class="overview-card__name">${escapeHTML(idx.name)}</div>
              <div class="overview-card__ticker">${escapeHTML(idx.symbol)}</div>
            </div>
          </div>
          <div class="overview-card__value num">${formatCompactNumber(idx.price)}</div>
          <div class="overview-card__foot">
            ${changeValueInline(idx.changePercent)}
            <div class="overview-card__spark">${sparklineSVG(idx.sparkline, isUp)}</div>
          </div>
        </div>`;
      })
      .join('');
    revealOnScroll($$('.overview-card', container));
  } catch (err) {
    renderError(container, { title: "Couldn't load market overview", onRetry: renderMarketOverview });
  }
}

/* ============================================================================
 * Trending stocks
 * ========================================================================== */

let watchlistSymbols = new Set();

async function renderTrending() {
  const container = $('#trendingGrid');
  container.innerHTML = skeletonCard(6);
  try {
    const stocks = await api.getTrending();
    if (!stocks.length) return renderEmpty(container, { title: 'Nothing trending right now' });

    container.innerHTML = stocks.map((s) => stockCardTemplate(s)).join('');
    revealStagger($$('.stock-card', container));
    bindWatchlistToggles(container);
  } catch (err) {
    renderError(container, { title: "Couldn't load trending stocks", onRetry: renderTrending });
  }
}

function stockCardTemplate(s) {
  const isUp = s.changePercent >= 0;
  const isWatched = watchlistSymbols.has(s.symbol);
  return `
    <div class="card card--interactive stock-card" data-symbol="${escapeHTML(s.symbol)}">
      <div class="stock-card__top">
        ${stockLogo(s.symbol)}
        <div class="stock-card__id">
          <div class="stock-card__symbol">${escapeHTML(s.symbol)}</div>
          <div class="stock-card__name">${escapeHTML(s.name)}</div>
        </div>
        <button class="watchlist-toggle ${isWatched ? 'is-active' : ''}" data-symbol="${escapeHTML(s.symbol)}" aria-label="Toggle watchlist">
          ${icon('star')}
        </button>
      </div>
      <div class="stock-card__spark">${sparklineSVG(s.sparkline, isUp)}</div>
      <div class="stock-card__bottom">
        <span class="stock-card__price num">${formatCurrency(s.price)}</span>
        ${changePill(s.changePercent)}
      </div>
    </div>`;
}

function bindWatchlistToggles(scope) {
  $$('.watchlist-toggle', scope).forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const symbol = btn.dataset.symbol;
      if (watchlistSymbols.has(symbol)) watchlistSymbols.delete(symbol);
      else watchlistSymbols.add(symbol);
      btn.classList.toggle('is-active');
    });
  });
}

/* ============================================================================
 * Market movers (gainers / losers)
 * ========================================================================== */

async function renderMovers() {
  const gainersEl = $('#gainersTable');
  const losersEl = $('#losersTable');
  gainersEl.innerHTML = skeletonRows(5);
  losersEl.innerHTML = skeletonRows(5);
  try {
    const { gainers, losers } = await api.getMovers();
    gainersEl.innerHTML = gainers.map(moverRow).join('');
    losersEl.innerHTML = losers.map(moverRow).join('');
  } catch (err) {
    renderError(gainersEl.closest('.card'), { title: "Couldn't load movers", onRetry: renderMovers });
  }
}

function moverRow(s) {
  return `
    <tr data-symbol="${escapeHTML(s.symbol)}">
      <td class="cell-name">
        ${stockLogo(s.symbol, { size: 'sm' })}
        <div>
          <div class="cell-symbol">${escapeHTML(s.symbol)}</div>
          <div class="cell-sub">${escapeHTML(s.name)}</div>
        </div>
      </td>
      <td class="is-numeric num">${formatCurrency(s.price)}</td>
      <td class="is-numeric">${changePill(s.changePercent)}</td>
    </tr>`;
}

/* ============================================================================
 * Watchlist strip
 * ========================================================================== */

async function renderWatchlist() {
  const container = $('#watchlistContainer');
  container.innerHTML = skeletonCard(4);
  try {
    const items = await api.getWatchlist();
    items.forEach((s) => watchlistSymbols.add(s.symbol));
    if (!items.length) return renderEmpty(container, { title: 'Your watchlist is empty' });

    container.innerHTML = items
      .map((s) => {
        const isUp = s.changePercent >= 0;
        return `
        <div class="card card--interactive watchlist-card" data-symbol="${escapeHTML(s.symbol)}">
          <div class="watchlist-card__head">
            ${stockLogo(s.symbol, { size: 'sm' })}
            <div class="stock-card__id">
              <div class="stock-card__symbol">${escapeHTML(s.symbol)}</div>
            </div>
          </div>
          <div class="watchlist-card__spark">${sparklineSVG(s.sparkline, isUp)}</div>
          <div class="stock-card__bottom">
            <span class="stock-card__price num">${formatCurrency(s.price)}</span>
            ${changePill(s.changePercent)}
          </div>
        </div>`;
      })
      .join('');
    revealStagger($$('.watchlist-card', container));
  } catch (err) {
    renderError(container, { title: "Couldn't load watchlist", onRetry: renderWatchlist });
  }
}

/* ============================================================================
 * Transactions
 * ========================================================================== */

async function renderTransactions() {
  const container = $('#transactionsTable');
  container.innerHTML = skeletonRows(6);
  try {
    const txs = await api.getTransactions();
    if (!txs.length) return renderEmpty(container.closest('.card'), { title: 'No transactions yet' });

    container.innerHTML = txs
      .map((tx) => {
        const isBuy = tx.type === 'buy';
        return `
        <tr>
          <td class="cell-name">
            ${stockLogo(tx.symbol, { size: 'sm' })}
            <div>
              <div class="cell-symbol">${escapeHTML(tx.symbol)}</div>
              <div class="cell-sub">${escapeHTML(tx.name)}</div>
            </div>
          </td>
          <td><span class="pill ${isBuy ? 'pill--bull' : 'pill--bear'}">${isBuy ? 'Buy' : 'Sell'}</span></td>
          <td class="is-numeric num">${tx.shares}</td>
          <td class="is-numeric num">${formatCurrency(tx.price)}</td>
          <td class="is-numeric num">${formatCurrency(tx.total)}</td>
          <td class="text-tertiary">${formatDate(tx.date, 'short')}</td>
        </tr>`;
      })
      .join('');
  } catch (err) {
    renderError(container.closest('.card'), { title: "Couldn't load transactions", onRetry: renderTransactions });
  }
}

/* ============================================================================
 * News
 * ========================================================================== */

async function renderNews() {
  const container = $('#newsContainer');
  container.innerHTML = skeletonCard(4);
  try {
    const news = await api.getNews();
    if (!news.length) return renderEmpty(container, { title: 'No news right now' });

    container.innerHTML = news
      .map(
        (n) => `
      <div class="card news-card reveal">
        <div class="news-card__thumb" style="background:hsl(${n.hue} 55% 22%)"></div>
        <div class="news-card__body">
          <span class="news-card__source">${escapeHTML(n.source)}</span>
          <span class="news-card__headline">${escapeHTML(n.headline)}</span>
          <span class="news-card__desc">${escapeHTML(n.description)}</span>
          <span class="news-card__time">${timeAgo(n.timestamp)}</span>
        </div>
      </div>`
      )
      .join('');
    revealOnScroll($$('.news-card', container));
  } catch (err) {
    renderError(container, { title: "Couldn't load news", onRetry: renderNews });
  }
}

/* ============================================================================
 * Portfolio chart (TradingView Lightweight Charts)
 * ========================================================================== */

let chart = null;
let series = null;
let currentRange = '1M';

function initChartInstance() {
  const container = $('#portfolioChart');
  if (!container || typeof LightweightCharts === 'undefined') return;

  chart = LightweightCharts.createChart(container, {
    layout: {
      background: { type: 'solid', color: 'transparent' },
      textColor: 'rgba(148, 154, 172, 1)',
      fontFamily: getComputedStyle(document.body).getPropertyValue('--font-ui') || 'sans-serif',
    },
    grid: {
      vertLines: { color: 'rgba(255,255,255,0.04)' },
      horzLines: { color: 'rgba(255,255,255,0.04)' },
    },
    rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
    timeScale: { borderColor: 'rgba(255,255,255,0.08)' },
    crosshair: { mode: LightweightCharts.CrosshairMode.Magnet },
    autoSize: true,
  });

  series = chart.addAreaSeries({
    lineColor: '#7c6cff',
    topColor: 'rgba(124, 108, 255, 0.35)',
    bottomColor: 'rgba(124, 108, 255, 0.02)',
    lineWidth: 2,
    priceLineVisible: false,
  });
}

async function loadChartRange(range) {
  currentRange = range;
  try {
    const history = await api.getPortfolioHistory(range);
    
    if (!history.length) return;

    const isIntraday = range === '1D';
    const data = history.map((bar) => ({
      time : bar.date,
      value: bar.net_worth,
    }));
    series?.setData(data);
    chart?.timeScale().fitContent();

    const first = history[0].net_worth;
    const last = history[history.length - 1].net_worth;
    const changePercent = ((last - first) / first) * 100;

    $('#chartToolbarValue').textContent = formatCurrency(last);
    const changeEl = $('#chartToolbarChange');
    changeEl.innerHTML = changeValueInline(changePercent);
  } catch (err) {
    console.error('[dashboard] chart range failed', err);
  }
}

function initChartControls() {
  const controls = $('#chartRangeControls');
  if (!controls) return;
  $$('.segmented__btn', controls).forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.segmented__btn', controls).forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      loadChartRange(btn.dataset.range);
    });
  });
}

async function initPortfolioChart() {
  initChartInstance();
  initChartControls();
  await loadChartRange(currentRange);
  window.addEventListener('resize', () => chart?.timeScale().fitContent());
}

/* ============================================================================
 * Search
 * ========================================================================== */

function initSearch() {
  const input = $('#searchInput');
  const dropdown = $('#searchDropdown');
  if (!input || !dropdown) return;

  const close = () => {
    dropdown.hidden = true;
    dropdown.innerHTML = '';
  };

  const runSearch = debounce(async (query) => {
    if (!query.trim()) return close();
    dropdown.hidden = false;
    dropdown.innerHTML = `<div class="search__section-label">Searching…</div>`;
    try {
      const results = await api.search(query);
      if (!results.length) {
        dropdown.innerHTML = `<div class="search__empty">No matches for "${escapeHTML(query)}"</div>`;
        return;
      }
      dropdown.innerHTML = `
        <div class="search__section-label">Symbols</div>
        ${results
          .map((r) => {
            const isUp = r.changePercent >= 0;
            return `
          <div class="search__result" data-symbol="${escapeHTML(r.symbol)}">
            ${stockLogo(r.symbol, { size: 'sm' })}
            <div class="search__result-info">
              <div class="search__result-symbol">${escapeHTML(r.symbol)}</div>
              <div class="search__result-name">${escapeHTML(r.name)}</div>
            </div>
            <div class="search__result-price">
              <div class="num">${formatCurrency(r.price)}</div>
              ${changeValueInline(r.changePercent)}
            </div>
          </div>`;
          })
          .join('')}`;
    } catch (err) {
      dropdown.innerHTML = `<div class="search__empty">Search unavailable right now</div>`;
    }
  }, 250);

  input.addEventListener('input', (e) => runSearch(e.target.value));
  input.addEventListener('focus', () => {
    if (input.value.trim()) dropdown.hidden = false;
  });
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== input) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    }
    if (e.key === 'Escape') close();
  });
}

/* ============================================================================
 * Boot
 * ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initChrome();
  initSearch();

  renderHero();
  renderMarketOverview();
  renderTrending();
  renderMovers();
  renderWatchlist();
  renderTransactions();
  renderNews();
  initPortfolioChart();

  revealOnScroll($$('.reveal'));
});
