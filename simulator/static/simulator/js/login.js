/* ============================================================
   TradeSims — login.js
   Handles: field validation, show/hide password,
   live mini-market preview in the left panel,
   submit loading state, and ripple effect.
   Much leaner than register.js — no strength meter or rules.
   ============================================================ */

'use strict';


/* ========================
   ELEMENT REFERENCES
   ======================== */

const loginForm    = document.getElementById('loginForm');
const lnSubmitBtn  = document.getElementById('lnSubmitBtn');
const fieldUser    = document.getElementById('id_username');
const fieldPass    = document.getElementById('id_password');


/* ========================
   INLINE VALIDATION HELPERS
   (same pattern as register.js)
   ======================== */

/**
 * Resolve the first aria-describedby id that starts with 'err-'.
 * @param {HTMLInputElement} input
 * @returns {HTMLElement|null}
 */
function getErrEl(input) {
  const ids = (input.getAttribute('aria-describedby') || '').split(' ');
  const id  = ids.find(i => i.startsWith('err-'));
  return id ? document.getElementById(id) : null;
}

function setValid(input) {
  input.classList.remove('rg-input--error');
  input.classList.add('rg-input--valid');
  const el = getErrEl(input);
  if (el) { el.textContent = ''; el.setAttribute('aria-hidden', 'true'); }
}

function setError(input, message) {
  input.classList.remove('rg-input--valid');
  input.classList.add('rg-input--error');
  const el = getErrEl(input);
  if (el) { el.textContent = message; el.removeAttribute('aria-hidden'); }
}

function clearState(input) {
  input.classList.remove('rg-input--valid', 'rg-input--error');
}


/* ========================
   FIELD VALIDATORS
   ======================== */

function validateUsername() {
  const v = fieldUser.value.trim();
  if (!v) {
    setError(fieldUser, 'Please enter your username or email.');
    return false;
  }
  setValid(fieldUser);
  return true;
}

function validatePassword() {
  const v = fieldPass.value;
  if (!v) {
    setError(fieldPass, 'Please enter your password.');
    return false;
  }
  // Minimum sanity check — real auth happens server-side
  if (v.length < 6) {
    setError(fieldPass, 'Password must be at least 6 characters.');
    return false;
  }
  setValid(fieldPass);
  return true;
}


/* ========================
   BLUR VALIDATION
   ======================== */

fieldUser.addEventListener('blur', validateUsername);
fieldPass.addEventListener('blur', validatePassword);

// Clear error on re-focus
[fieldUser, fieldPass].forEach(f => {
  f.addEventListener('focus', () => {
    if (f.classList.contains('rg-input--error')) clearState(f);
  });
});


/* ========================
   SHOW / HIDE PASSWORD
   ======================== */

document.querySelectorAll('.rg-pw-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;

    const isHidden = input.type === 'password';
    input.type     = isHidden ? 'text' : 'password';

    const icon = btn.querySelector('i');
    if (icon) icon.className = isHidden ? 'bi bi-eye-slash' : 'bi bi-eye';

    btn.setAttribute('aria-pressed', String(isHidden));
    btn.setAttribute('aria-label',   isHidden ? 'Hide password' : 'Show password');
  });
});


/* ========================
   FORM SUBMIT
   ======================== */

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    const valid = validateUsername() & validatePassword();

    if (!valid) {
      e.preventDefault();
      const firstErr = loginForm.querySelector('.rg-input--error');
      if (firstErr) {
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErr.focus();
      }
      return;
    }

    // Show spinner
    lnSubmitBtn.classList.add('loading');
    lnSubmitBtn.disabled = true;
    // Django will redirect on success — no need to reset
  });
}


/* ========================
   MINI MARKET PREVIEW (left panel)
   Five stocks, ticked every ~2 s.
   Mirrors the approach in script.js but scoped to the login panel.
   ======================== */

const LN_STOCKS = [
  { sym: 'AAPL',  name: 'Apple',   price: 213.07, color: '#6366f1' },
  { sym: 'NVDA',  name: 'NVIDIA',  price: 875.32, color: '#10b981' },
  { sym: 'TSLA',  name: 'Tesla',   price: 182.63, color: '#ef4444' },
  { sym: 'MSFT',  name: 'Microsoft', price: 415.89, color: '#3b82f6' },
  { sym: 'AMZN',  name: 'Amazon',  price: 191.54, color: '#f59e0b' },
];

// Seed each stock with a base price and day change
LN_STOCKS.forEach(s => {
  s.open     = s.price;
  s.changePct = 0;
});

/**
 * Build the initial HTML rows inside #lnMarketRows.
 */
function buildMarketRows() {
  const container = document.getElementById('lnMarketRows');
  if (!container) return;

  container.innerHTML = LN_STOCKS.map((s, i) => `
    <div class="ln-market-row">
      <div>
        <div class="ln-mr-sym">${s.sym}</div>
        <div class="ln-mr-name">${s.name}</div>
      </div>
      <div class="ln-mr-price" id="ln-price-${i}">$${s.price.toFixed(2)}</div>
      <div class="ln-mr-change up" id="ln-chg-${i}">
        <i class="bi bi-arrow-up-short"></i>0.00%
      </div>
    </div>
  `).join('');
}

/**
 * Simulate a price tick and update the DOM.
 */
function tickMarket() {
  LN_STOCKS.forEach((s, i) => {
    const delta   = (Math.random() - 0.48) * s.price * 0.004;
    s.price       = Math.max(0.01, s.price + delta);
    s.changePct   = ((s.price - s.open) / s.open) * 100;

    const priceEl = document.getElementById(`ln-price-${i}`);
    const chgEl   = document.getElementById(`ln-chg-${i}`);
    if (!priceEl || !chgEl) return;

    const isUp    = delta > 0;
    const arrow   = isUp ? '<i class="bi bi-arrow-up-short"></i>' : '<i class="bi bi-arrow-down-short"></i>';
    const pctStr  = (s.changePct >= 0 ? '+' : '') + s.changePct.toFixed(2) + '%';

    // Flash
    priceEl.classList.remove('ln-flash-up', 'ln-flash-down');
    void priceEl.offsetWidth; // force reflow
    priceEl.classList.add(isUp ? 'ln-flash-up' : 'ln-flash-down');

    priceEl.textContent = `$${s.price.toFixed(2)}`;
    chgEl.className     = `ln-mr-change ${isUp ? 'up' : 'down'}`;
    chgEl.innerHTML     = `${arrow}${pctStr}`;
  });
}

buildMarketRows();
setInterval(tickMarket, 2400);


/* ========================
   RIPPLE EFFECT
   Guard against double-binding with script.js
   ======================== */

document.querySelectorAll('.ts-ripple').forEach(btn => {
  if (btn.dataset.rippleBound) return;
  btn.dataset.rippleBound = 'true';

  btn.addEventListener('click', e => {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x    = e.clientX - rect.left - size / 2;
    const y    = e.clientY - rect.top  - size / 2;

    const wave = document.createElement('span');
    wave.className = 'ts-ripple-wave';
    wave.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
    btn.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
  });
});