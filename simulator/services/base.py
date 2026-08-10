import yfinance as yf
from yahooquery import Screener

from ..models import Stock
from .create_new_stock import add_stock_to_supported_lists

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
    from .get_quote_data import get_data
    try:
        response = screener.get_screeners(screening_type, count=count)
        stocks = response.get(screening_type, {}).get("quotes", [])

        supported_stocks = []

        for stock in stocks:
            symbol = stock.get("symbol")

            if not symbol:
                continue

            if Stock.objects.filter(symbol=symbol).exists():
                supported_stocks.append(stock)
                continue

            try:
                print(f"[SCREENING] New stock found: {symbol}")

                data = get_data(symbol)

                if not data:
                    print(f"[SCREENING] get_data failed for {symbol}")
                    continue

                print(f"[SCREENING] Got data for {symbol}")

                data.pop("last_updated", None)

                Stock.objects.create(**data)

                print(f"[SCREENING] Created Stock: {symbol}")

                add_stock_to_supported_lists(symbol)

                print(f"[SCREENING] Added {symbol} to top stocks")

                supported_stocks.append(stock)

            except Exception as e:
                print(f"[SCREENING] FAILED {symbol}: {type(e).__name__}: {e}")
                continue

        return supported_stocks
    except Exception:
        return []