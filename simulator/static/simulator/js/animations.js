/**
 * animations.js
 * ---------------------------------------------------------------------------
 * Every time-based visual effect in the dashboard lives here: reveal-on-load,
 * staggered grid entrances, animated count-up numbers, and the sentiment
 * reactive glow behind the hero figures. Kept deliberately small — per the
 * brief, "no excessive animations."
 * ---------------------------------------------------------------------------
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
  : null;

/** Fade a single element (or list) in once it scrolls into view. */
export function revealOnScroll(elements) {
  const list = elements instanceof Element ? [elements] : Array.from(elements);
  list.forEach((el) => {
    el.classList.add('reveal');
    if (prefersReducedMotion || !revealObserver) {
      el.classList.add('is-visible');
    } else {
      revealObserver.observe(el);
    }
  });
}

/** Same as revealOnScroll but staggers children with an incremental delay —
 *  used for freshly-rendered card grids (trending stocks, market overview). */
export function revealStagger(elements) {
  const list = elements instanceof Element ? [elements] : Array.from(elements);
  list.forEach((el, i) => {
    el.style.setProperty('--stagger-index', i);
    el.classList.add('stagger-item');
    if (prefersReducedMotion || !revealObserver) {
      el.classList.add('is-visible');
    } else {
      revealObserver.observe(el);
    }
  });
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animate a numeric value from `from` to `to`, writing through `formatter`
 * on every frame. Used for the hero's portfolio value / P&L / buying power.
 */
export function animateCount(el, { to, from = 0, duration = 1100, formatter = (v) => v.toFixed(2) } = {}) {
  if (!el) return;
  if (prefersReducedMotion) {
    el.textContent = formatter(to);
    return;
  }
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const value = from + (to - from) * easeOutCubic(t);
    el.textContent = formatter(value);
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = formatter(to);
  }
  requestAnimationFrame(frame);
}

/** Briefly tint a numeral to flag a live update (e.g. a quote tick). */
export function flashValue(el, isPositive) {
  if (!el || prefersReducedMotion) return;
  el.classList.remove('flash-up', 'flash-down');
  // eslint-disable-next-line no-unused-expressions
  el.offsetWidth; // force reflow so the animation can restart
  el.classList.add(isPositive ? 'flash-up' : 'flash-down');
}

/**
 * The one signature ambient effect of this UI: the soft glow behind the
 * hero portfolio figure tints itself toward the day's real sentiment
 * instead of sitting on a fixed decorative gradient.
 */
export function setSentiment(isPositive, root = document.documentElement) {
  root.style.setProperty('--sentiment', isPositive ? 'var(--bull)' : 'var(--bear)');
  root.style.setProperty('--sentiment-soft', isPositive ? 'var(--bull-soft)' : 'var(--bear-soft)');
}
