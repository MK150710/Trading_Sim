(function () {
    'use strict';

    function cssVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }
    function easeOutCubic(t) { return 1-Math.pow(1 - t, 3); }
    function hexToRgba(hex, alpha) {
        const h = hex.replace('#', '');
        const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
        const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    class StockChart {
        constructor(canvas, tooltipEl) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.tooltipEl = tooltipEl;
            this.labels = [];
            this.prices = [];
            this.prevPrices = null;
            this.animStart = 0;
            this.animDuration = 520;
            this.raf = null;
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.hoverIndex = null;
            this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            
            this._onMove = this._onMove.bind(this);
            this._onLeave = this._onLeave.bind(this);
            canvas.addEventListener('mousemove', this._onMove);
            canvas.addEventListener('mouseleave', this._onLeave);
            canvas.addEventListener('touchmove', e => { this._onMove(e.touches[0]); }, { passive: true });
            canvas.addEventListener('touchend', this._onLeave);
            
            this.ro = new ResizeObserver(() => this._resize());
            this.ro.observe(canvas.parentElement);
            this._resize();
        }

            _resize() {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = Math.max(1, rect.width * this.dpr);
            this.canvas.height = Math.max(1, rect.height * this.dpr);
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
            this._draw(1);
        }
    
        setData(labels, prices, { animate=true } = {}) {
            if (this.prices.length && animate && !this.reducedMotion) {
                this.prevPrices = this.prices.slice();
                //Resample prevPruices to match new length, makes interpolation stable
                if (this.prevPrices.length !== prices.length) {
                    const resampled = [];
                    for (let i = 0; i < prices.length; i++) {
                        const t = i / (prices.length - 1 || 1);
                        const idx = t * (this.prevPrices.length - 1);
                        const lo = Math.floor(idx), hi = Math.ceil(idx);
                        resampled.push(this.prevPrices[lo] + (this.prevPrices[hi] - this.prevPrices[lo]) * (idx - lo));
                    }
                    this.prevPrices = resampled;
                }
                this.labels = labels;
                this.prices = prices;
                this._animate();
            } else {
                this.labels = labels;
                this.prices = prices;
                this.prevPrices = null;
                this._draw(1);
            }
        }

        _animate() {
            cancelAnimationFrame(this.raf);
            this.animStart = performance.now();
            const step = (now) => {
                const t = Math.min(1, (now - this.animStart) / this.animDuration);
                this._draw(easeOutCubic(t));
                if (t < 1) this.raf = requestAnimationFrame(step);
            };
            this.raf = requestAnimationFrame(step);
        }

        _currentPrices(t) {
            if (!this.prevPrices || t >= 1) return this.prices;
            return this.prices.map((p, i) => this.prevPrices[i] + (p - this.prevPrices[i]) * t);
        }

        _draw(t) {
            const { ctx, canvas } = this;
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            const prices = this._currentPrices(t);
            if (!prices.length) return;

            const padL = 8 * this.dpr, padR = 8 * this.dpr, padT = 18 * this.dpr, padB = 26 * this.dpr;
            const plotW = w - padL - padR, plotH = h - padT - padB;
            const min = Math.min(...prices), max = Math.max(...prices);
            const range = (max - min) || 1;
            const pad = range * 0.12;
            const yMin = min - pad, yMax = max + pad;

            const x = i => padL + (i / (prices.length - 1 || 1)) * plotW;
            const y = v => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

            const isUp = prices[prices.length - 1] >= prices[0];
            const lineColor = isUp ? cssVar('--color-gain') : cssVar('--color-loss');
            const gridColor = cssVar('--color-border');
            const textColor = cssVar('--color-text-tertiary');

            // Gridlines
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1 * this.dpr;
            const monoFont = cssVar('--font-mono') || 'monospace';
            ctx.font = `${11 * this.dpr}px ${monoFont}`;
            ctx.fillStyle = textColor;
            const rows = 4;
            for (let r = 0; r <= rows; r++) {
                const gy = padT + (plotH / rows) * r;
                ctx.beginPath();
                ctx.setLineDash([3 * this.dpr, 4 * this.dpr]);
                ctx.moveTo(padL, gy);
                ctx.lineTo(w - padR, gy);
                ctx.stroke();
                const val = yMax - ((yMax - yMin) / rows) * r;
                ctx.setLineDash([]);
                ctx.textBaseline = 'middle';
                ctx.fillText('$' + val.toFixed(2), padL + 4 * this.dpr, gy - 6 * this.dpr);
            }

            //Area gradient fill
            const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
            grad.addColorStop(0, hexToRgba(lineColor, 0.28));
            grad.addColorStop(1, hexToRgba(lineColor, 0.02));
            ctx.beginPath();
            ctx.moveTo(x(0), y(prices[0]));
            prices.forEach((p, i) => ctx.lineTo(x(i), y(p)));
            ctx.lineTo(x(prices.length - 1), padT + plotH);
            ctx.lineTo(x(0), padT + plotH);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();

            //Line
            ctx.beginPath();
            prices.forEach((p, i) => {
                const px = x(i), py = y(p);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2.2 * this.dpr;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.stroke();

            //Crosshair and hover dot
            if (this.hoverIndex !== null && this.hoverIndex < prices.length) {
                const i = this.hoverIndex;
                const px = x(i), py = y(prices[i]);
                ctx.beginPath();
                ctx.setLineDash([4 * this.dpr, 4 * this.dpr]);
                ctx.strokeStyle = textColor;
                ctx.lineWidth = 1 * this.dpr;
                ctx.moveTo(px, padT);
                ctx.lineTo(px, padT + plotH);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.beginPath();
                ctx.arc(px, py, 4.5 * this.dpr, 0, Math.PI * 2);
                ctx.fillStyle = lineColor;
                ctx.fill();
                ctx.lineWidth = 2 * this.dpr;
                ctx.strokeStyle = cssVar('--color-surface') || '#fff';
                ctx.stroke();
            }

            this._plotGeom = { padL, padT, plotW, plotH, yMin, yMax };
        }

        _onMove(evt) {
            const rect = this.canvas.getBoundingClientRect();
            const cx = (evt.clientX - rect.left) * this.dpr;
            const n = this.prices.length;
            if (!n || !this._plotGeom) return;
            const { padL, plotW } = this._plotGeom;
            const ratio = Math.min(1, Math.max(0, (cx - padL) / plotW));
            const idx = Math.round(ratio * (n - 1));
            this.hoverIndex = idx;
            this._draw(1);
            if (this.tooltipEl) {
                const price = this.prices[idx];
                const label = this.labels[idx];
                this.tooltipEl.querySelector('.price').textContent = '$' + price.toFixed(2);
                this.tooltipEl.querySelector('.date').textContent = label;
                this.tooltipEl.style.left = (evt.clientX - rect.left) + 'px';
                this.tooltipEl.style.top = '0px';
                this.tooltipEl.classList.add('is-visible');
            }
        }

        _onLeave() {
            this.hoverIndex = null;
            this._draw(1);
            if (this.tooltipEl) this.tooltipEl.classList.remove('is-visible');
        }

        destroy() {
            cancelAnimationFrame(this.raf);
            this.ro.disconnect();
        }
    }

    window.StockChart = StockChart;
})();