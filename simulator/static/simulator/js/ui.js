/**
 * ui.js
 * ---------------------------------------------------------------------------
 * Generic UI chrome shared by every section: formatting, the inline icon
 * set, stock-logo placeholders, skeleton/empty/error state templates, and
 * the sidebar / dropdown / clock behaviors. Nothing here knows about
 * StockAPI or any specific section — it only ever touches the DOM it's
 * handed or returns markup strings.
 * ---------------------------------------------------------------------------
 */

/* ============================================================================
 * DOM shorthands
 * ========================================================================== */

export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function debounce(fn, wait = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/* ============================================================================
 * Formatting
 * ========================================================================== */

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usdCompact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });
const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export function formatCurrency(value, { compact = false } = {}) {
  return compact ? usdCompact.format(value) : usd.format(value);
}

export function formatSignedCurrency(value) {
  const sign = value > 0 ? '+' : value < 0 ? '\u2212' : '';
  return `${sign}${formatCurrency(Math.abs(value))}`;
}

export function formatPercent(value, { showSign = true } = {}) {
  const sign = showSign && value > 0 ? '+' : value < 0 ? '\u2212' : '';
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

export function formatCompactNumber(value) {
  return compactNumber.format(value);
}

export function formatDate(isoString, style = 'medium') {
  const date = new Date(isoString);
  if (style === 'short') return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function sentiment(value) {
  return value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
}

/* ============================================================================
 * Stock logo placeholders (no external logo assets required)
 * ========================================================================== */

const LOGO_PALETTE = ['#7c6cff', '#2bd576', '#ff5c72', '#ffb454', '#4cc9f0', '#f472b6', '#a78bfa', '#34d399'];

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function symbolColor(symbol) {
  return LOGO_PALETTE[hashSeed(symbol) % LOGO_PALETTE.length];
}

export function stockLogo(symbol, { size = 'md' } = {}) {
  const color = symbolColor(symbol);
  const initials = escapeHTML(symbol.slice(0, 2).toUpperCase());
  return `<div class="stock-logo stock-logo--${size}" style="background:${color}1f;color:${color}">${initials}</div>`;
}

/* ============================================================================
 * Inline icon set (24x24 stroke icons, currentColor — no icon-font/CDN dep)
 * ========================================================================== */

const ICONS = {
  logoMark: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 17l5-5 4 4 7-8" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  portfolio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M20 7.5A8 8 0 1 0 20 16.5"/></svg>',
  markets: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-6 4 3 5-7 4 4"/><path d="M3 21h18"/></svg>',
  watchlist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
  transactions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10V6a2 2 0 0 1 2-2h9l3 3"/><path d="M17 14v4a2 2 0 0 1-2 2H6l-3-3"/><path d="M17 3v5h5M2 16v5h5"/></svg>',
  profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3.1 6.6 7.2.9-5.3 5 1.4 7.2-6.4-3.5-6.4 3.5 1.4-7.2-5.3-5 7.2-.9z"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  arrowDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
  alertCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>',
};

export function icon(name) {
  return ICONS[name] || '';
}

/* ============================================================================
 * Skeleton / empty / error templates
 * ---------------------------------------------------------------------------
 * Every data-driven section calls renderSkeleton() immediately, then either
 * fills in real markup, or calls renderEmpty()/renderError() if the fetch
 * (real or placeholder-fallback) comes back empty or throws.
 * ========================================================================== */

export function skeletonCard(count = 3) {
  return Array.from({ length: count })
    .map(
      () => `
      <div class="card card--padded">
        <div class="skeleton skeleton-line" style="width:40%;margin-bottom:12px"></div>
        <div class="skeleton skeleton-block" style="height:28px;width:70%;margin-bottom:14px"></div>
        <div class="skeleton skeleton-line" style="width:55%"></div>
      </div>`
    )
    .join('');
}

export function skeletonRows(count = 5) {
  return Array.from({ length: count })
    .map(
      () => `
      <tr>
        <td colspan="99">
          <div class="skeleton skeleton-line" style="width:100%;height:16px"></div>
        </td>
      </tr>`
    )
    .join('');
}

export function renderEmpty(container, { title = 'Nothing here yet', body = '', icon: iconName = 'inbox' } = {}) {
  container.innerHTML = `
    <div class="state-panel">
      <div class="state-panel__icon">${icon(iconName)}</div>
      <div class="state-panel__title">${escapeHTML(title)}</div>
      ${body ? `<div class="state-panel__body">${escapeHTML(body)}</div>` : ''}
    </div>`;
}

export function renderError(container, { title = 'Couldn\u2019t load this section', body = 'Something went wrong on our end.', onRetry } = {}) {
  const retryId = `retry-${Math.random().toString(36).slice(2, 8)}`;
  container.innerHTML = `
    <div class="state-panel state-panel--error">
      <div class="state-panel__icon">${icon('alertCircle')}</div>
      <div class="state-panel__title">${escapeHTML(title)}</div>
      <div class="state-panel__body">${escapeHTML(body)}</div>
      ${onRetry ? `<button class="retry-btn" id="${retryId}">Try again</button>` : ''}
    </div>`;
  if (onRetry) $(`#${retryId}`, container)?.addEventListener('click', onRetry);
}

/* ============================================================================
 * Sidebar behavior (desktop rail-collapse + mobile off-canvas drawer)
 * ========================================================================== */

export function initSidebar() {
  const sidebar = $('#sidebar');
  const scrim = $('#sidebarScrim');
  const collapseBtn = $('#sidebarCollapseBtn');
  const menuBtn = $('#navMenuBtn');
  if (!sidebar) return;

  const openDrawer = () => {
    sidebar.classList.add('is-open');
    scrim?.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
  };
  const closeDrawer = () => {
    sidebar.classList.remove('is-open');
    scrim?.classList.remove('is-visible');
    document.body.style.overflow = '';
  };

  menuBtn?.addEventListener('click', () => {
    sidebar.classList.contains('is-open') ? closeDrawer() : openDrawer();
  });
  scrim?.addEventListener('click', closeDrawer);

  collapseBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('is-collapsed');
    localStorage?.setItem?.('tradesims:sidebarCollapsed', sidebar.classList.contains('is-collapsed'));
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) closeDrawer();
  });
}

/* ============================================================================
 * Generic dropdown (notifications bell / profile menu)
 * ========================================================================== */

export function initDropdown(triggerId, panelId) {
  const trigger = document.getElementById(triggerId);
  const panel = document.getElementById(panelId);
  if (!trigger || !panel) return;

  const close = () => {
    panel.classList.remove('is-visible');
    document.removeEventListener('click', onDocClick);
  };
  const onDocClick = (e) => {
    if (!panel.contains(e.target) && !trigger.contains(e.target)) close();
  };

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = panel.classList.contains('is-visible');
    $$('.dropdown-panel.is-visible').forEach((p) => p.classList.remove('is-visible'));
    if (!isOpen) {
      panel.classList.add('is-visible');
      document.addEventListener('click', onDocClick);
    } else {
      close();
    }
  });
}

/* ============================================================================
 * Clock + market-status pill (based on US exchange hours, America/New_York)
 * ========================================================================== */

function isMarketOpen(date = new Date()) {
  const hour = date.getHours();
  return hour >= 9 && hour < 23;
}

export function initClock() {
  const clockEl = $('#navClock');
  const statusEl = $('#marketStatus');
  const statusLabel = $('#marketStatusLabel');

  function tick() {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    }
    if (statusEl && statusLabel) {
      const open = isMarketOpen(now);
      statusEl.classList.toggle('is-open', open);
      statusEl.classList.toggle('is-closed', !open);
      statusLabel.textContent = open ? 'Market Open' : 'Market Closed';
    }
  }
  tick();
  return setInterval(tick, 1000);
}

export function initGreeting() {
  const el = $('#greetingText');
  if (!el) return;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  el.textContent = greeting;
}

document.addEventListener('DOMContentLoaded', () => {
  const profileTrigger = document.getElementById('profileTrigger');
  const profilePanel = document.getElementById('profilePanel');

  profileTrigger.addEventListener('click', (event) => {
    event.stopPropagation();
    profilePanel.classList.toggle('is-active');
  });

  window.addEventListener('click', (event) => {
    event.stopPropagation();
    profile.classList.toggle('is-active');
  })

  window.addEventListener('click', (event) => {
    if (!profileTrigger.contains(event.target) && !profile.contains(event.target)) {
      profilePanel.classList.remove('is-active');
    }
  });
})