import yfinance as yf
from django.utils import timezone
from .base import get_daily_candles
import pandas as pd


def safe(value):
    return None if pd.isna(value) else value


def get_data(symbol):
    try:
        ticker = yf.Ticker(symbol)

        history = ticker.history(period="1mo")

        if history.empty or "Close" not in history.columns:
            return None

        closes = history["Close"].dropna()

        if len(closes) < 2:
            return None

        current = float(closes.iloc[-1])
        previous = float(closes.iloc[-2])

        info = ticker.info

        company_name = safe(info.get("shortName"))
        exchange = safe(info.get("exchange"))
        sparkline = get_daily_candles(symbol)

        # Skip if any required data is missing
        if (
            company_name is None
            or exchange is None
            or len(sparkline) != 7
        ):
            return None

        volume = 0
        if "Volume" in history.columns:
            volumes = history["Volume"].dropna()
            if not volumes.empty:
                volume = int(volumes.iloc[-1])

        return {
            "symbol": symbol,
            "company_name": company_name,
            "current_price": current,
            "exchange": exchange,
            "sparkline": sparkline,
            "previous_close": previous,
            "last_updated": timezone.now(),
            "is_featured": True,
            "volume": volume,
        }

    except Exception as e:
        print(f"[{symbol}] ❌ get_data ERROR: {type(e).__name__}: {e}", flush=True)