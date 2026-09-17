import os
import sys
import time
import re
from math import isnan
from time import sleep
from concurrent.futures import ThreadPoolExecutor

# Make the project root visible when running this file directly
PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)

sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "trading.settings"
)

import django
django.setup()

from simulator.static.simulator.top_stocks import TOP_STOCKS
from simulator.services.get_quote_data import get_data
from simulator.models import Stock

def process_single_stock(symbol):
    """Worker function executed in parallel by each thread."""
    try:
        stock_data = get_data(symbol)

        if stock_data is None:
            return

        stock, created = Stock.objects.get_or_create(
            symbol=stock_data["symbol"],
            defaults=stock_data
        )

        for field, value in stock_data.items():
            if isinstance(value, float) and isnan(value):
                continue
            setattr(stock, field, value)

        stock.save()
        print(f"Updated: {symbol}")

    except Exception as e:
        print(f"Error fetching {symbol}: {e}")

def update_stocks():
    # Process up to 4 stocks concurrently
    with ThreadPoolExecutor(max_workers=8) as executor:
        executor.map(process_single_stock, TOP_STOCKS)

if __name__ == "__main__":
    update_stocks()