import pandas as pd
import yfinance as yf


def get_financials(symbol):
    try:
        ticker = yf.Ticker(symbol)
        quarter = ticker.quarterly_income_stmt

        if quarter.empty:
            return []

        rows = []

        for col in reversed(quarter.columns):

            rev = (
                quarter.loc["Total Revenue", col]
                if "Total Revenue" in quarter.index
                else None
            )

            net = (
                quarter.loc["Net Income", col]
                if "Net Income" in quarter.index
                else None
            )

            gross_profit = (
                quarter.loc["Gross Profit", col]
                if "Gross Profit" in quarter.index
                else None
            )

            if "Diluted EPS" in quarter.index:
                eps = quarter.loc["Diluted EPS", col]
            elif "Basic EPS" in quarter.index:
                eps = quarter.loc["Basic EPS", col]
            else:
                eps = None

            # Skip if any required value is missing
            if any(pd.isna(x) for x in (rev, net, gross_profit, eps)):
                continue

            # Skip invalid revenue
            if rev == 0:
                continue

            gross_margin = (gross_profit / rev) * 100

            rows.append({
                "quarter": (
                    f"Q{col.quarter} {col.year}"
                    if hasattr(col, "quarter")
                    else str(col)[:10]
                ),
                "revenue": float(rev),
                "netIncome": float(net),
                "eps": float(eps),
                "grossMargin": float(gross_margin),
            })

        return rows

    except Exception as e:
        print(f"financials ERROR for {symbol}: {repr(e)}")
        return []