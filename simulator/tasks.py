from .static.simulator.top_stocks import TOP_STOCKS
from .services.get_quote_data import get_data
from .models import Stock
from math import isnan
from time import sleep

def update_stocks():

    for symbol in TOP_STOCKS:
        try:
            stock_data = get_data(symbol)

            if stock_data is None:
                continue
                    
            stock, _ = Stock.objects.get_or_create(
                symbol=stock_data["symbol"],
                defaults=stock_data
            )

            for field, value in stock_data.items():
                if isinstance(value, float) and isnan(value):
                    print(f"{symbol}: {field} = NaN")
                setattr(stock, field, value)

            print(f"{symbol} completed")
            stock.save()

            sleep(30)

        except Exception as e:
            print(f"Exception at stock {symbol}: {e}")