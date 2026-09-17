import os
import sys
import time
import re
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed

# Make the project root visible when running this file directly
PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../..")
)

sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "trading.settings"
)

import django
django.setup()

import pandas as pd
import yfinance as yf
from django.core.cache import cache

from simulator.services.yf_session import yf_session
from simulator.static.simulator.top_stocks import TOP_STOCKS


# ============================================================
# CACHE SETTINGS
# ============================================================

CACHE_TIMEOUT = 60 * 60 * 96  # 4 days


# ============================================================
# CHART RANGES
# ============================================================

RANGES = {
    "1D": ("1d", "5m"),
    "1W": ("5d", "30m"),
    "1M": ("1mo", "1d"),
    "3M": ("3mo", "1d"),
    "6M": ("6mo", "1d"),
    "1Y": ("1y", "1d"),
    "5Y": ("5y", "1wk"),
    "MAX": ("max", "1mo"),
}


# ============================================================
# HELPERS
# ============================================================

def safe(value):
    return None if pd.isna(value) else value


# ============================================================
# CHART DATA
# ============================================================

def get_chart(symbol, range_="1M"):
    symbol = symbol.upper()
    range_ = range_.upper()

    period, interval = RANGES.get(range_, ("1mo", "1d"))
    cache_key = f"chart_{symbol}_{range_}"

    # Cache Lookup
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        print(f"💾 {symbol} {range_} FOUND IN CACHE", flush=True)
        return cached_data

    # Fetch from yfinance
    print(f"🌐 {symbol} {range_} FETCHING CHART FROM YFINANCE", flush=True)

    try:
        ticker = yf.Ticker(symbol, session=yf_session)
        hist = ticker.history(period=period, interval=interval)
    except Exception as e:
        print(f"❌ CHART ERROR for {symbol} {range_}: {repr(e)}", flush=True)
        return {
            "candles": [],
            "stats": {"change": 0, "changePercent": 0, "high": 0, "low": 0}
        }

    if hist is None or hist.empty:
        print(f"⚠️ NO CHART DATA for {symbol} {range_}", flush=True)
        return {
            "candles": [],
            "stats": {"change": 0, "changePercent": 0, "high": 0, "low": 0}
        }

    hist = hist.dropna()

    # Candles
    candles = []
    for timestamp, row in hist.iterrows():
        try:
            candles.append({
                "time": int(timestamp.timestamp()),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
            })
        except (KeyError, TypeError, ValueError, AttributeError):
            continue

    # Stats
    change = 0
    change_pct = 0
    high = 0
    low = 0

    if candles:
        first = candles[0]["close"]
        last = candles[-1]["close"]
        change = round(last - first, 2)

        if first != 0:
            change_pct = round((change / first) * 100, 2)

        high = max(candle["high"] for candle in candles)
        low = min(candle["low"] for candle in candles)

    chart_data = {
        "candles": candles,
        "stats": {
            "change": change,
            "changePercent": change_pct,
            "high": high,
            "low": low,
        }
    }

    cache.set(cache_key, chart_data, timeout=CACHE_TIMEOUT)
    print(f"💾 {symbol} {range_} SAVED TO REDIS", flush=True)

    return chart_data


# ============================================================
# FULL STOCK DATA
# ============================================================

def all_stock_data(symbol):
    symbol = symbol.upper()
    cache_key = f"stock_data_{symbol}"

    cached_data = cache.get(cache_key)
    if cached_data is not None:
        print(f"💾 {symbol} FOUND IN CACHE", flush=True)
        return cached_data

    print(f"🌐 {symbol} FETCHING FROM YFINANCE", flush=True)

    info = {}
    about_data = {}
    financials_data = []
    news_data = []
    stats_data = {}

    # Info
    try:
        ticker = yf.Ticker(symbol, session=yf_session)
        info = ticker.info
        print(f"[{symbol}] INFO RECEIVED", flush=True)
    except Exception as e:
        print(f"GET INFO ERROR for {symbol}: {repr(e)}", flush=True)

    # About
    try:
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
            summary.replace("Inc.", "Inc•")
            .replace("Corp.", "Corp•")
            .replace("Ltd.", "Ltd•")
            .replace("Co.", "Co•")
            .replace("PLC.", "PLC•")
            .replace("N.V.", "N•V•")
            .replace("S.A.", "S•A•")
        )

        match = re.search(r"(?<=\.)\s", temp)
        one_line_summary = summary[:match.start() + 1] if match else summary

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
        print(f"ABOUT ERROR for {symbol}: {repr(e)}", flush=True)

    # Financials
    try:
        quarter = ticker.quarterly_income_stmt
        if not quarter.empty:
            for col in reversed(quarter.columns):
                rev = quarter.loc["Total Revenue", col] if "Total Revenue" in quarter.index else None
                net = quarter.loc["Net Income", col] if "Net Income" in quarter.index else None
                gross_profit = quarter.loc["Gross Profit", col] if "Gross Profit" in quarter.index else None

                if "Diluted EPS" in quarter.index:
                    eps = quarter.loc["Diluted EPS", col]
                elif "Basic EPS" in quarter.index:
                    eps = quarter.loc["Basic EPS", col]
                else:
                    eps = None

                if any(pd.isna(x) for x in (rev, net, gross_profit, eps)) or rev == 0:
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

        print(f"[{symbol}] FINANCIALS RECEIVED: {len(financials_data)} quarters", flush=True)
    except Exception as e:
        print(f"FINANCIALS ERROR for {symbol}: {repr(e)}", flush=True)

    # News
    r_news = []
    try:
        r_news = ticker.news or []
        print(f"[{symbol}] NEWS RECEIVED: {len(r_news)} items", flush=True)
    except Exception as e:
        print(f"NEWS ERROR for {symbol}: {repr(e)}", flush=True)

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
                    pub_dt = datetime.fromisoformat(pub_time_str.replace("Z", "+00:00"))
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
            print(f"NEWS ITEM ERROR for {symbol}: {repr(e)}", flush=True)

    # Statistics
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
        print(f"STATS ERROR for {symbol}: {repr(e)}", flush=True)

    all_data = {
        "about": about_data,
        "financials": financials_data,
        "news": news_data,
        "statistics": stats_data,
    }

    cache.set(cache_key, all_data, timeout=CACHE_TIMEOUT)
    print(f"💾 {symbol} SAVED TO REDIS", flush=True)

    return all_data


# ============================================================
# WORKER TASK & PARALLEL EXECUTION
# ============================================================

def process_symbol(symbol):
    """Processes stock data and all chart ranges for a single symbol."""
    print(
        f"\n==============================\n"
        f"🚀 STARTING {symbol}\n"
        f"==============================",
        flush=True
    )

    # 1. Fetch & Cache Stock Data
    try:
        data = all_stock_data(symbol)
        print(
            f"✅ {symbol} STOCK DATA COMPLETE | "
            f"About: {bool(data.get('about'))} | "
            f"Stats: {bool(data.get('statistics'))} | "
            f"Financials: {len(data.get('financials', []))} | "
            f"News: {len(data.get('news', []))}",
            flush=True
        )
    except Exception as e:
        print(f"❌ {symbol} STOCK DATA FAILED: {repr(e)}", flush=True)

    # 2. Fetch & Cache All Chart Ranges
    for range_name in RANGES:
        try:
            chart_data = get_chart(symbol, range_name)
            print(
                f"   📈 {symbol} {range_name} CHART COMPLETE "
                f"({len(chart_data.get('candles', []))} candles)",
                flush=True
            )
        except Exception as e:
            print(f"   ❌ {symbol} {range_name} CHART FAILED: {repr(e)}", flush=True)

    # Polite delay per worker execution to prevent rapid rate limits
    time.sleep(1)


def update_all_stocks(max_workers=12):
    """Executes update for all symbols in parallel using thread pool."""
    print(f"🔥🔥🔥 STARTING PARALLEL STOCK DATA UPDATE ({max_workers} WORKERS) 🔥🔥🔥", flush=True)
    print(f"🔥 Total stocks: {len(TOP_STOCKS)}", flush=True)

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(process_symbol, symbol): symbol 
            for symbol in TOP_STOCKS
        }

        for future in as_completed(futures):
            symbol = futures[future]
            try:
                future.result()
            except Exception as e:
                print(f"💥 UNHANDLED ERROR processing {symbol}: {repr(e)}", flush=True)

    print("\n🔥🔥🔥 FULL UPDATE COMPLETE 🔥🔥🔥", flush=True)


if __name__ == "__main__":
    update_all_stocks(max_workers=12) 