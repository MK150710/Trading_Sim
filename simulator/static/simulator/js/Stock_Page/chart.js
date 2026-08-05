(function () {
    'use strict';

    function cssVar(name) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(name)
            .trim();
    }

    function candleColors() {
        return {
            upColor: cssVar("--color-gain"),
            downColor: cssVar("--color-loss"),
            borderUpColor: cssVar("--color-gain"),
            borderDownColor: cssVar("--color-loss"),
            wickUpColor: cssVar("--color-gain"),
            wickDownColor: cssVar("--color-loss")
        };
    }
    class StockChart {
        constructor(container) {
            this.container = container;
            this.chart = LightweightCharts.createChart(container, {
                autoSize: true,
                layout: {
                    background: {
                        color: cssVar("--color-surface")
                    },
                    textColor: cssVar("--color-text-secondary"),
                    fontFamily: cssVar("--font-body")
                },
                grid: {
                    vertLines: {
                        color: cssVar("--color-border")
                    },
                    horzLines: {
                        color: cssVar("--color-border")
                    }
                },
                localization: {
                    priceFormatter: price => `$${price.toFixed(2)}`
                },
                crosshair: {
                    mode: LightweightCharts.CrosshairMode.Normal
                },
                rightPriceScale: {
                    borderColor: cssVar("--color-border")
                },
                timeScale: {
                    borderColor: cssVar("--color-border"),
                    timeVisible: true,
                    secondsVisible: false
                },
                handleScroll: {
                    mouseWheel: true,
                    pressedMouseMove: true,
                    horzTouchDrag: true,
                    vertTouchDrag: false
                },
                handleScale: {
                    mouseWheel: true,
                    pinch: true,
                    axisPressedMouseMove: true
                }
            });
            this.candleSeries = this.chart.addSeries(
                LightweightCharts.CandlestickSeries,
                {
                    ...candleColors(),
                    priceScaleId: "right"
                }
            );
            this.ro = new ResizeObserver(() => this.resize());
            this.ro.observe(container);
            this.mo = new MutationObserver(() => this.applyTheme());
            this.mo.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ["data-theme"]
            });
        }
        setData(candles, fit = true) {
            if (!candles?.length) return;
            this.candleSeries.setData(candles);
            if (fit) {
                this.chart.timeScale().fitContent();
            }
        }
        resize() {
            this.chart.applyOptions({
                width: this.container.clientWidth,
                height: this.container.clientHeight
            });
        }
        applyTheme() {
            this.chart.applyOptions({
                layout: {
                    background: {
                        color: cssVar("--color-surface")
                    },
                    textColor: cssVar("--color-text-secondary"),
                    fontFamily: cssVar("--font-body")
                },
                grid: {
                    vertLines: {
                        color: cssVar("--color-border")
                    },
                    horzLines: {
                        color: cssVar("--color-border")
                    }
                },
                rightPriceScale: {
                    borderColor: cssVar("--color-border")
                },
                timeScale: {
                    borderColor: cssVar("--color-border")
                }
            });
            this.candleSeries.applyOptions(candleColors());
        }
        destroy() {
            this.ro.disconnect();
            this.mo.disconnect();
            this.chart.remove();
        }
    }
    window.StockChart = StockChart;
})();