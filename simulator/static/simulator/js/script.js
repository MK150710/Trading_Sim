/* ============================================================
   TradeSims — script.js
   Handles: theme toggle, navbar, market data simulation,
   ticker, sparklines, scroll reveal, counter animation,
   and ripple effect.
   ============================================================ */

'use strict';

/* ========================
   THEME (DARK / LIGHT)
   ======================== */

const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
const html        = document.documentElement;

// Load saved preference
const savedTheme = localStorage.getItem('ts-theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('ts-theme', next);
  updateThemeIcon(next);
});

function updateThemeIcon(theme) {
  themeIcon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
}


/* ========================
   NAVBAR SCROLL
   ======================== */

const navbar = document.getElementById('mainNavbar');

const navbarObserver = new IntersectionObserver(
  ([entry]) => {
    navbar.classList.toggle('scrolled', !entry.isIntersecting);
  },
  { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
);

// Observe the hero section — when it leaves viewport top, add scrolled class
const heroSection = document.getElementById('home');
if (heroSection) navbarObserver.observe(heroSection);

// Highlight active nav link on scroll
const sections  = document.querySelectorAll('section[id], div[id]');
const navLinks  = document.querySelectorAll('.ts-nav-link');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle(
          'active',
          link.getAttribute('href') === '#' + entry.target.id
        );
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => sectionObserver.observe(s));

function formatVolume(volume) {
    if (volume >= 1_000_000_000)
        return (volume / 1_000_000_000).toFixed(1) + "B";
    if (volume >= 1_000_000)
        return (volume / 1_000_000).toFixed(1) + "M";
    if (volume >= 1_000)
        return (volume / 1_000).toFixed(1) + "K";
    return volume.toString();
}

/** Render the market rows */
function renderMarketRows() {
  const container = document.getElementById('marketRows');
  if (!container) return;

  container.innerHTML = '';

  stocks.forEach((s, i) => {
    const isUp     = s.changePct >= 0;
    const arrow    = isUp ? '<i class="bi bi-arrow-up-short"></i>' : '<i class="bi bi-arrow-down-short"></i>';
    const cls      = isUp ? 'up' : 'down';
    const pctStr   = (isUp ? '+' : '') + s.changePct.toFixed(2) + '%';
    const priceStr = '$' + s.price.toFixed(2);

    const row = document.createElement('div');
    row.className = 'ts-market-row';
    row.id        = 'mrow-' + i;

    row.innerHTML = `
      <div class="ts-mr-stock">
        <div class="ts-mr-avatar" style="background:${s.bg};color:${s.color}">${s.sym[0]}</div>
        <div>
          <div class="ts-mr-sym">${s.sym}</div>
          <div class="ts-mr-name">${s.name}</div>
        </div>
      </div>
      <div class="ts-mr-price" id="price-${i}">${priceStr}</div>
      <div class="ts-mr-change ${cls}" id="change-${i}">${arrow}${pctStr}</div>
      <div class="ts-mr-vol d-none d-md-block">${formatVolume(s.volume)}</div>
      <div class="d-none d-lg-block">
        <canvas class="ts-sparkline" id="spark-${i}" width="90" height="36" aria-label="${s.sym} price trend"></canvas>
      </div>
    `;

    container.appendChild(row);
    // Draw sparkline after insertion
    requestAnimationFrame(() => drawSparkline(i));
  });
}

/** Draw a mini sparkline on a canvas */
function drawSparkline(index) {
  const canvas = document.getElementById('spark-' + index);
  if (!canvas) return;

  const ctx  = canvas.getContext('2d');
  const data = stocks[index].history;
  const w    = canvas.width;
  const h    = canvas.height;
  const min  = Math.min(...data);
  const max  = Math.max(...data);
  const range = max - min || 1;
  const isUp  = stocks[index].changePct >= 0;
  const color = isUp ? '#10b981' : '#ef4444';

  ctx.clearRect(0, 0, w, h);

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, isUp ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.beginPath();
  data.forEach((val, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((val - min) / range) * (h - 4) - 2;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });

  // Close path for fill
  const lastX = w;
  const lastY = h - ((data[data.length - 1] - min) / range) * (h - 4) - 2;
  ctx.lineTo(lastX, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Draw line
  ctx.beginPath();
  data.forEach((val, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((val - min) / range) * (h - 4) - 2;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;
  ctx.lineJoin    = 'round';
  ctx.stroke();
}

let stocks = [];

const avatarColors = [
  { bg: "rgba(99,102,241,0.15)", color: "#6366f1" }, 
  { bg: "rgba(16,185,129,0.15)", color: "#10b981" }, 
  { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },  
  { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" }, 
  { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" }, 
];

async function loadMarketRows() {
  const response = await fetch("/api/landing-market");
  const data = await response.json();

  stocks = data.map((stock, i) => ({
    sym: stock.symbol,
    name: stock.name,
    price:stock.current_price,
    changePct : stock.change_percent,
    volume: stock.volume,
    history: stock.sparkline,
    ...avatarColors[i % avatarColors.length]
  }))

  renderMarketRows()

}

loadMarketRows();


/* ========================
   TICKER BAR
   ======================== */

const tickerSymbols = [
  { sym: 'AAPL',  price: 213.07, pct: +1.84 },
  { sym: 'NVDA',  price: 875.32, pct: +4.21 },
  { sym: 'TSLA',  price: 182.63, pct: -2.17 },
  { sym: 'MSFT',  price: 415.89, pct: +0.93 },
  { sym: 'AMZN',  price: 191.54, pct: +2.35 },
  { sym: 'GOOGL', price: 172.82, pct: +1.07 },
  { sym: 'META',  price: 503.14, pct: +0.61 },
  { sym: 'BRK.B', price: 371.20, pct: -0.42 },
  { sym: 'JPM',   price: 194.33, pct: +1.23 },
  { sym: 'V',     price: 274.90, pct: +0.77 },
  { sym: 'NFLX',  price: 618.44, pct: -1.05 },
  { sym: 'AMD',   price: 162.73, pct: +3.14 },
];

function buildTicker() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;

  // Duplicate for seamless loop
  const items = [...tickerSymbols, ...tickerSymbols];

  track.innerHTML = items.map(t => {
    const up     = t.pct >= 0;
    const arrow  = up ? '▲' : '▼';
    const cls    = up ? 'up' : 'down';
    const sign   = up ? '+' : '';
    return `
      <span class="ts-tick-item">
        <span class="ts-tick-sym">${t.sym}</span>
        <span class="ts-tick-price">$${t.price.toFixed(2)}</span>
        <span class="ts-tick-chg ${cls}">${arrow} ${sign}${t.pct.toFixed(2)}%</span>
      </span>
    `;
  }).join('');
}

buildTicker();


/* ========================
   SCROLL REVEAL
   ======================== */

const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealElements.forEach(el => revealObserver.observe(el));


/* ========================
   COUNTER ANIMATION
   ======================== */

const counters = document.querySelectorAll('.ts-stat-num');

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.animated) {
      entry.target.dataset.animated = 'true';
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

counters.forEach(c => counterObserver.observe(c));

function animateCounter(el) {
  const target    = parseFloat(el.dataset.target);
  const suffix    = el.dataset.suffix || '';
  const decimal   = parseInt(el.dataset.decimal || '0', 10);
  const duration  = 1800; // ms
  const startTime = performance.now();

  function tick(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = target * eased;

    el.textContent = current.toFixed(decimal) + suffix;

    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target.toFixed(decimal) + suffix;
  }

  requestAnimationFrame(tick);
}


/* ========================
   RIPPLE EFFECT
   ======================== */

document.querySelectorAll('.ts-ripple').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height);
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;

    const wave   = document.createElement('span');
    wave.className = 'ts-ripple-wave';
    wave.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
    `;
    btn.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
  });
});


/* ========================
   SMOOTH SCROLL for ANCHOR LINKS
   ======================== */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Close mobile menu if open
      const bsCollapse = document.getElementById('navbarContent');
      if (bsCollapse && bsCollapse.classList.contains('show')) {
        const toggler = document.querySelector('.ts-toggler');
        if (toggler) toggler.click();
      }
    }
  });
});
