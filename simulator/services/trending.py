import yfinance as yf
from .base import get_daily_candles, get_screening


def get_trending_data():

    stocks = get_screening("most_actives")
    data_list = []

    for stock in stocks:
        data_list.append({
            "symbol": stock["symbol"],
            "name": stock["shortName"],
            "price": stock["regularMarketPrice"],
            "change": stock["regularMarketChange"],
            "changePercent": stock["regularMarketChangePercent"],
            "sparkline" : get_daily_candles(stock["symbol"])
        })

    return data_list