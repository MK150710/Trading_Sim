import yfinance as yf

RANGES = {
    "1D": ("1d", "5m"),
    "1W": ("5d", "30m"),
    "1M": ("1mo", "1d"),
    "3M": ("3mo", "1d"),
    "6M": ("6mo", "1d"),
    "1Y": ("1y", "1d"),
    "5Y": ("5y", "1wk"),
    "MAX": ("max", "1mo"),
}

def get_chart(symbol, range_="1M"):
    period, interval = RANGES.get(range_.upper(), ("1mo", "1d"))

    hist = yf.Ticker(symbol).history(
        period = period,
        interval = interval
    )

    hist = hist.dropna()

    candles = []

    for time, row in hist.iterrows():
        candles.append({
            "time": int(time.timestamp()),
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
        })

        change, change_pct, high, low = 0, 0, 0, 0
        if candles:

            first = candles[0]['close']
            last = candles[-1]['close']

            change = round(last - first, 2)
            change_pct = round((change / first) * 100, 2)

            high = max(c["high"] for c in candles)
            low = min(c["low"] for c in candles)


    return {
        "candles": candles,
        "stats": {
            "change": change,
            "changePercent": change_pct,
            "high": high,
            "low": low
        }
    }