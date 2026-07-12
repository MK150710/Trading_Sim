from .static.simulator.top_stocks import TOP_STOCKS
from .services.get_quote_data import get_data
from .models import Stock

def update_stocks():

    for symbol in TOP_STOCKS:
        stock_data = get_data(symbol)

        if stock_data is None:
            continue
                
        stock, _ = Stock.objects.get_or_create(
            symbol=stock_data["symbol"],
            defaults=stock_data
        )

        for field, value in stock_data.items():
            setattr(stock, field, value)
        stock.save()
