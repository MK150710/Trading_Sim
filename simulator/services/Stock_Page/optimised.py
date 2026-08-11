import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "trading.settings")

import django
django.setup()

import pandas as pd
import yfinance as yf
from django.core.cache import cache
import re
from datetime import datetime, timezone

def safe(value):
    return None if pd.isna(value) else value


def all_stock_data(symbol):

    symbol = symbol.upper()
    cache_key = f"stock_data_{symbol}"

    cached_data = cache.get(cache_key)

    if cached_data is not None:
        return cached_data

    info = {}

    about_data = {}
    financials_data = []
    news_data = []
    stats_data = {}

    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
    except Exception as e:
        print(f"GET INFO ERROR for {symbol}: {repr(e)}")

    try:
        # About part
        officers = info.get("companyOfficers") or []
        
        ceo = next(
            (
                safe(officer.get("name"))
                for officer in officers
                if isinstance(officer, dict)
                and (
                    "ceo" in officer.get("title", "").lower()
                    or "chief executive" in officer.get("title", "").lower()
                )
            ),
            "N/A",
        )

        summary = safe(info.get("longBusinessSummary")) or ""

        temp = (
            summary
            .replace("Inc.", "Inc•")
            .replace("Corp.", "Corp•")
            .replace("Ltd.", "Ltd•")
            .replace("Co.", "Co•")
            .replace("PLC.", "PLC•")
            .replace("N.V.", "N•V•")
            .replace("S.A.", "S•A•")
        )

        match = re.search(r"(?<=\.)\s", temp)

        if match:
            one_line_summary = summary[: match.start() + 1]
        else:
            one_line_summary = summary

        parts = [
            safe(info.get("city")),
            safe(info.get("state")),
            safe(info.get("country")),
        ]

        headquarters = ", ".join(filter(None, parts)) or "N/A"

        employees = safe(info.get("fullTimeEmployees"))
        employees = f"{employees:,}" if employees else "N/A"

        website = safe(info.get("website")) or "N/A"

        about_data = {
            "name": safe(info.get("longName")) or symbol,
            "sector": safe(info.get("sector")) or "N/A",
            "industry": safe(info.get("industry")) or "N/A",
            "ceo": ceo,
            "hq": headquarters,
            "employees": employees,
            "website": website,
            "description": one_line_summary or "N/A",
        }

    except Exception as e:
        print(f"ABOUT ERROR: {repr(e)}")

    # Financials 

    try:
        quarter = ticker.quarterly_income_stmt

        if quarter.empty:
            financials_data =  []

        else:

            financials_data = []

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

                financials_data.append({
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

    except Exception as e:
        print(f"financials ERROR for {symbol}: {repr(e)}")
        financials_data = []

    # News
    r_news = []

    try:
        r_news = ticker.news or []
    except Exception as e:
        print(f"NEWS ERROR for {symbol}: {repr(e)}")

    news_data = []
    now = datetime.now(timezone.utc)

    for item in r_news[:4]:
        try:
            content = item.get("content", item)

            headline = safe(content.get("title"))

            provider = content.get("provider", {})
            source = (
                safe(provider.get("displayName"))
                if isinstance(provider, dict)
                else safe(provider)
            )

            click_url = content.get("clickThroughUrl", {})
            url = (
                safe(click_url.get("url"))
                if isinstance(click_url, dict)
                else safe(click_url)
            )

            image_url = None
            thumbnail = content.get("thumbnail") or item.get("thumbnail")

            if isinstance(thumbnail, dict):
                image_url = safe(thumbnail.get("originalUrl"))

                if image_url is None and thumbnail.get("resolutions"):
                    resolutions = thumbnail["resolutions"]
                    if resolutions:
                        image_url = safe(resolutions[0].get("url"))

            published_ago = None
            pub_time_str = content.get("pubDate")

            if pub_time_str:
                try:
                    pub_dt = datetime.fromisoformat(
                        pub_time_str.replace("Z", "+00:00")
                    )

                    diff = now - pub_dt

                    hours, remainder = divmod(diff.total_seconds(), 3600)
                    minutes, _ = divmod(remainder, 60)

                    if hours >= 24:
                        published_ago = f"{int(hours // 24)}d ago"
                    elif hours >= 1:
                        published_ago = f"{int(hours)}h ago"
                    else:
                        published_ago = f"{int(minutes)}m ago"

                except ValueError:
                    pass

            news_data.append({
                "image": image_url,
                "headline": headline,
                "source": source,
                "publishedAgo": published_ago,
                "url": url,
            })

        except Exception as e:
            print(f"news ERROR for {symbol}: {repr(e)}")
            continue


    # Stats
    try:
        stats_data = {
            "open": safe(info.get("open")),
            "prevClose": safe(info.get("previousClose")),
            "dayHigh": safe(info.get("dayHigh")),
            "dayLow": safe(info.get("dayLow")),
            "week52High": safe(info.get("fiftyTwoWeekHigh")),
            "week52Low": safe(info.get("fiftyTwoWeekLow")),
            "marketCap": safe(info.get("marketCap")),
            "volume": safe(info.get("volume")),
            "avgVolume": safe(info.get("averageVolume")),
            "peRatio": safe(info.get("trailingPE")),
            "eps": safe(info.get("trailingEps")),
            "dividendYield": safe(info.get("dividendYield")),
            "beta": safe(info.get("beta")),
        }

    except Exception as e:
        print(f"STATS ERROR for {symbol}: {repr(e)}")


    all_data = {
        "about": about_data,
        "financials": financials_data,
        "news": news_data,
        "statistics": stats_data
    }

    cache.set(
        cache_key,
        all_data,
        timeout=1800
    )

    

    return all_data


data = all_stock_data("AAPL")

print(data.keys())
print(data["about"])
print(data["statistics"])