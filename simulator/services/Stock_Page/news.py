from datetime import datetime, timezone
import yfinance as yf

def get_news(symbol):
    ticker = yf.Ticker(symbol)
    r_news = ticker.news

    formatted_news = []
    now = datetime.now(timezone.utc)

    for item in r_news[:4]:
        content = item.get("content", item)

        headline = content.get("title")

        provider = content.get("provider", {})
        source = (
            provider.get("displayName")
            if isinstance(provider, dict)
            else provider
        )

        click_url = content.get("clickThroughUrl", {})
        url = click_url.get("url") if isinstance(click_url, dict) else click_url

        image_url = None
        thumbnail = content.get("thumbnail") or item.get("thumbnail")

        if isinstance(thumbnail, dict):
            image_url = thumbnail.get("originalUrl")
            if not image_url and thumbnail.get("resolutions"):
                resolutions = thumbnail["resolutions"]
                if resolutions:
                    image_url = resolutions[0].get("url")

        pub_time_str = content.get("pubDate")
        published_ago = None

        if pub_time_str:
            pub_dt = datetime.fromisoformat(
                pub_time_str.replace("Z", "+00:00")
            )
            diff = now - pub_dt

            hours, remainder = divmod(diff.total_seconds(), 3600)
            minutes, _ = divmod(remainder, 60)

            if hours >= 24:
                days = int(hours // 24)
                published_ago = f"{days}d ago"
            elif hours >= 1:
                published_ago = f"{int(hours)}h ago"
            else:
                published_ago = f"{int(minutes)}m ago"

        formatted_news.append(
            {
                "image": image_url,
                "headline": headline,
                "source": source,
                "publishedAgo": published_ago,
                "url": url
            }
        )

    return formatted_news