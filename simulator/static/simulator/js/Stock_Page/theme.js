(function () {
    'use strict';
    const STORAGE_KEY = 'tradesims:theme';

    function systemPref() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme, { animate= false } = {}) {
        const root = document.documentElement;
        if (animate) {
            root.classList.add('theme-transitioning');
            window.setTimeout(() => root.classList.remove('theme-transitioning'), 420);
        }
        root.setAttribute('data-theme', theme);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', theme === 'dark' ? '#070B14' : '#F5F7FB');
    }

    function initTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        const theme = saved || systemPref();
        applyTheme(theme);
        return theme;
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next, { animate: true});
        localStorage.setItem(STORAGE_KEY, next);
        return next;
    }

    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem(STORAGE_KEY)) applyTheme(e.matches ? 'dark' : 'light', { animate: true});
        });
    }

    window.TSTheme = { initTheme, toggleTheme, applyTheme };
}) ()