import yfinance as yf
from yahooquery import Screener

screener = Screener()


def get_daily_candles(symbol, days=7):
    try:
        ticker = yf.Ticker(symbol)
        history = ticker.history(period=f"{days + 2}d")

        if history.empty or "Close" not in history.columns:
            return []

        closes = history["Close"].dropna().tail(days)

        if len(closes) != days:
            return []

        return closes.tolist()

    except Exception:
        return []


def get_screening(screening_type, count=5):
    try:
        response = screener.get_screeners(screening_type, count=count)
        return response.get(screening_type, {}).get("quotes", [])
    except Exception:
        return []