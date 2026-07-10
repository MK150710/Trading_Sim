from datetime import datetime, timedelta
from .base import client, get_daily_candles

def create_sparkline_data(symbol, days=7):
    return get_daily_candles(symbol, days)

def markets():
    
    INDICES = {
        "S&P 500" : "SPY",
        "NASDAQ" : "QQQ",
        "Dow Jones" : "DIA"
    }


    data = []

    for name, symbol in INDICES.items():

        sparkline = create_sparkline_data(symbol, 7)
        quote = client.quote(symbol)

        data.append({
            "name" : name,
            "symbol" : symbol,
            "price": quote["c"],
            "change": quote["d"],
            "changePercent": quote["dp"],
            "sparkline" : sparkline
        })

    return data