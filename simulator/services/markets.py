import yfinance as yf

def get_daily_candles(symbol, days=7): 
    ticker = yf.Ticker(symbol)
    history = ticker.history(period=f"{days + 2}d")

    if history.empty:
        return []
    
    return history["Close"].tail(days).tolist()


def markets():
    
    INDICES = {
        "S&P 500" : "SPY",
        "NASDAQ" : "QQQ",
        "Dow Jones" : "DIA"
    }


    data = []

    for name, symbol in INDICES.items():

        sparkline = get_daily_candles(symbol, 7)

        ticker = yf.Ticker(symbol)
        history = ticker.history(period="2d")

        current = history["Close"].iloc[-1]
        previous = history["Close"].iloc[-2]

        data.append({
            "name" : name,
            "symbol" : symbol,
            "price": current,
            "change": current-previous,
            "changePercent": ((current - previous) / previous) * 100,
            "sparkline" : sparkline
        })

    return data