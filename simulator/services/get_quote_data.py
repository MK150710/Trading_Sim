import yfinance as yf
from django.utils import timezone
from .base import get_daily_candles 

def get_data(symbol):

    ticker = yf.Ticker(symbol)
    history = ticker.history(period="2d")
    df = ticker.history(period="1mo")

    current = history["Close"].iloc[-1]
    previous = history["Close"].iloc[-2]
    data = {
        "symbol" : symbol,
        "company_name" : ticker.info.get("shortName"),
        "current_price": current,
        "exchange" : ticker.info.get("exchange"),
        "sparkline" : get_daily_candles(symbol),
        "previous_close": previous,
        "last_updated" : timezone.now(),
        "is_featured" : True,
        "volume" : int(df["Volume"].iloc[-1])
    }

    return data