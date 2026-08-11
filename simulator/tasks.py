from .static.simulator.top_stocks import TOP_STOCKS
from .services.get_quote_data import get_data
from .models import Stock
from math import isnan


def update_stocks():

    print("🔥🔥🔥 UPDATE_STOCKS FUNCTION STARTED 🔥🔥🔥", flush=True)
    print(f"🔥 Total stocks to process: {len(TOP_STOCKS)}", flush=True)
    print(f"🔥 Stocks: {TOP_STOCKS}", flush=True)

    for symbol in TOP_STOCKS:

        print(f"\n==============================", flush=True)
        print(f"🚀 STARTING STOCK: {symbol}", flush=True)
        print(f"==============================", flush=True)

        try:
            print(f"[{symbol}] Calling get_data()...", flush=True)

            stock_data = get_data(symbol)

            print(f"[{symbol}] get_data() RETURNED", flush=True)
            print(f"[{symbol}] Data type: {type(stock_data)}", flush=True)

            if stock_data is None:
                print(f"[{symbol}] ❌ get_data() returned None", flush=True)
                continue

            print(f"[{symbol}] Data received successfully", flush=True)
            print(f"[{symbol}] Data keys: {stock_data.keys()}", flush=True)

            print(f"[{symbol}] Calling Stock.objects.get_or_create()...", flush=True)

            stock, created = Stock.objects.get_or_create(
                symbol=stock_data["symbol"],
                defaults=stock_data
            )

            print(
                f"[{symbol}] get_or_create() completed | "
                f"created={created} | "
                f"stock_id={stock.id}",
                flush=True
            )

            print(f"[{symbol}] Updating fields...", flush=True)

            for field, value in stock_data.items():

                print(
                    f"[{symbol}] Processing field: {field} = {value}",
                    flush=True
                )

                if isinstance(value, float) and isnan(value):
                    print(
                        f"[{symbol}] ⚠️ {field} = NaN",
                        flush=True
                    )

                setattr(stock, field, value)

            print(f"[{symbol}] All fields assigned", flush=True)

            print(f"[{symbol}] Saving stock to database...", flush=True)

            stock.save()

            print(f"[{symbol}] ✅ DATABASE SAVE COMPLETE", flush=True)
            print(f"[{symbol}] ✅ COMPLETED", flush=True)

        except Exception as e:

            print(
                f"[{symbol}] ❌ EXCEPTION: {type(e).__name__}: {e}",
                flush=True
            )

    print("\n🔥🔥🔥 UPDATE_STOCKS FUNCTION FINISHED 🔥🔥🔥", flush=True)