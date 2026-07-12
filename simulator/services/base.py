import yfinance as yf
from yahooquery import Screener
screener = Screener()

def get_daily_candles(symbol, days=7): 
    ticker = yf.Ticker(symbol)
    history = ticker.history(period=f"{days + 2}d")

    if history.empty:
        return []
    
    return history["Close"].tail(days).tolist()



def get_screening(screening_type, count=5):
    return screener.get_screeners(screening_type, count=count)[screening_type]["quotes"]