from simulator.models import Stock
def markets():
    
    INDICES = {
        "S&P 500" : "SPY",
        "NASDAQ" : "QQQ",
        "Dow Jones" : "DIA"
    }


    data = []

    for name, symbol in INDICES.items():

        stock = Stock.objects.get(symbol=symbol)

        change = round(((stock.current_price - stock.previous_close) / stock.previous_close) * 100, 2)

        data.append({
            "name" : name,
            "symbol" : symbol,
            "price": float(stock.current_price),
            "change": float(stock.current_price - stock.previous_close),
            "changePercent": float(change),
            "sparkline" : stock.sparkline
        })

    return data