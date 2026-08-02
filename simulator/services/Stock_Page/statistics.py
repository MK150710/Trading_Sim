import yfinance as yf

def get_stats(symbol):

    ticker = yf.Ticker(symbol)
    info = ticker.info

    stats = {
        "open": info.get("open"),
        "prevClose": info.get("previousClose"),
        "dayHigh": info.get("dayHigh"),
        "dayLow": info.get("dayLow"),
        "week52High": info.get("fiftyTwoWeekHigh"),
        "week52Low": info.get("fiftyTwoWeekLow"),
        "marketCap": info.get("marketCap"),
        "volume": info.get("volume"),
        "avgVolume": info.get("averageVolume"),
        "peRatio": info.get("trailingPE"),
        "eps": info.get("trailingEps"),
        "dividendYield": info.get("dividendYield"),
        "beta": info.get("beta"),
    }

    return stats

