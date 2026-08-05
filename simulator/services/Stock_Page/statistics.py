import pandas as pd
import yfinance as yf


def clean(value):
    return None if pd.isna(value) else value


def get_stats(symbol):
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info

        return {
            "open": clean(info.get("open")),
            "prevClose": clean(info.get("previousClose")),
            "dayHigh": clean(info.get("dayHigh")),
            "dayLow": clean(info.get("dayLow")),
            "week52High": clean(info.get("fiftyTwoWeekHigh")),
            "week52Low": clean(info.get("fiftyTwoWeekLow")),
            "marketCap": clean(info.get("marketCap")),
            "volume": clean(info.get("volume")),
            "avgVolume": clean(info.get("averageVolume")),
            "peRatio": clean(info.get("trailingPE")),
            "eps": clean(info.get("trailingEps")),
            "dividendYield": clean(info.get("dividendYield")),
            "beta": clean(info.get("beta")),
        }

    except Exception:
        return {
            "open": None,
            "prevClose": None,
            "dayHigh": None,
            "dayLow": None,
            "week52High": None,
            "week52Low": None,
            "marketCap": None,
            "volume": None,
            "avgVolume": None,
            "peRatio": None,
            "eps": None,
            "dividendYield": None,
            "beta": None,
        }