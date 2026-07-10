import finnhub
import os
from dotenv import load_dotenv
import yfinance as yf

load_dotenv()

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")

client = finnhub.Client(
    api_key=FINNHUB_API_KEY
)

def get_daily_candles(symbol, days=7): 
    ticker = yf.Ticker(symbol)
    history = ticker.history(period=f"{days + 2}d")

    if history.empty:
        return []
    
    return history["Close"].tail(days).tolist()
