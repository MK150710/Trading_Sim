from yahooquery import Screener
import pandas as pd

s = Screener()

# Fetch day gainers or day losers
gainers_data = s.get_screeners('day_gainers', count=5)
df_gainers = pd.DataFrame(gainers_data['day_gainers']['quotes'])
losers_data = s.get_screeners('day_losers', count=5)
active_data = s.get_screeners('most_actives', count=10)

# Extract the clean DataFrame
print(df_gainers[['symbol', 'shortName', 'regularMarketPrice', 'regularMarketChangePercent']])

df_losers = pd.DataFrame(losers_data['day_losers']['quotes'])
print(df_losers[['symbol', 'shortName', 'regularMarketPrice', 'regularMarketChangePercent']])

df_active = pd.DataFrame(active_data['most_actives']['quotes'])
print(df_active[['symbol', 'shortName', 'regularMarketVolume', 'regularMarketPrice']])