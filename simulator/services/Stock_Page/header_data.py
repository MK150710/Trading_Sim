from django.utils import timezone
from simulator.models import Stock

def header(symbol):

    stock = Stock.objects.get(symbol=symbol.upper())

    change = float(stock.current_price - stock.previous_close)
    change_percent = round((change / float(stock.previous_close)) * 100, 2)

    return {
        "symbol": stock.symbol,
        "name": stock.company_name,
        "exchange": stock.exchange,
        "price": float(stock.current_price),
        "change": round(change, 2),
        "changePercent": change_percent,
        "marketStatus": "open",      
        "lastUpdated": timezone.now().isoformat()
    }