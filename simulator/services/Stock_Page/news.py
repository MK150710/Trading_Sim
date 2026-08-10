from datetime import datetime, timezone
import pandas as pd
import yfinance as yf


def safe(value):
    return None if pd.isna(value) else value


def get_news(symbol):
    try:
        ticker = yf.Ticker(symbol)
        r_news = ticker.news or []
    except Exception as e:
        print(f"news ERROR for {symbol}: {repr(e)}")
        return []

    formatted_news = []
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

            formatted_news.append({
                "image": image_url,
                "headline": headline,
                "source": source,
                "publishedAgo": published_ago,
                "url": url,
            })

        except Exception as e:
            print(f"news ERROR for {symbol}: {repr(e)}")
            continue

    return formatted_news