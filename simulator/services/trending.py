from .base import get_daily_candles, get_screening
import pandas as pd

def safe(value):
    return None if pd.isna(value) else value

def get_trending_data():

    stocks = get_screening("most_actives")
    data_list = []

    for stock in stocks:
        symbol = stock.get("symbol")

        if not symbol:
            continue

        data_list.append({
            "symbol": symbol,
            "name": safe(stock.get("shortName")) or symbol,
            "price": safe(stock.get("regularMarketPrice")),
            "change": safe(stock.get("regularMarketChange")),
            "changePercent": safe(stock.get("regularMarketChangePercent")),
            "sparkline": get_daily_candles(symbol),
        })

    return data_list