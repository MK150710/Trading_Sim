(function () {
    'use strict';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function observeReveal(selector = '.reveal') {
        const els = document.querySelectorAll(selector);
        if (reducedMotion || !('IntersectionObserver' in window)) {
            els.forEach(el => el.classList.add('is-visible'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        els.forEach(el => io.observe(el))
    }

    function countUp(el, from, to, { duration = 700, prefix='', decimals = 2} = {}) {
        if (reducedMotion) { el.textContext = prefix + to.toFixed(decimals); return; }
        const start = performance.now();
        function frame(now) {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1-t, 3);
            const val = from + (to - from) * eased;
            el.textContext = prefix + val.toFixed(decimals);
            if (t < 1) requestAnimationFrame(frame);
        } 
        requestAnimationFrame(frame);
    }

    function ripple(btn, evt) {
        if (reducedMotion) return;
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.4;
        const span = document.createElement('span');
        span.className = 'ripple';
        span.style.width = span.style.height = size + 'px';
        const x = (evt.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2;
        const y = (evt.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2;
        span.style.left = x + 'px';
        span.style.top = y + 'px';
        btn.appendChild(span);
        span.addEventListener('animationend', () => span.remove());
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn');
        if (btn) ripple(btn, e);
    })

    window.TSAnim = { observeReveal, countUp, ripple, reducedMotion};
})();