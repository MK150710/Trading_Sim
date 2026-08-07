# Making The stock page Have real data

**Hours:** *10*

# What I did

I made everythine from the head to the news get real data from yfinance.

Oh and also, one of my friends told me about Trading View so i scrapped my own chanrt and used their library to make an actual candlestick stock chart

## All changes

### Chart

- Scrapped the whole old chart
- Used trading view js library
- Actual candlestick chart
- YFin stock data sends it over an api to the stock page


### Stock head

- Gets data from yfin
- Has a fucntional button where ytou can wishlist and un wishlist stocks
- Price updates every 5 minutes

### All other parts

The following:
```
- About page
- Key statistics
- Financials
- News
- Order history
- Holding Position
```

Have been grabbed from backend ( YFin and DB models ) to display data in real time


### Buy/Sell

This is the only part of the page that is not using actual data, its still simulated and yotu cant really buy stuff rn. but soon itll work


## Role of AI

- This time, AI was only used as a helper to debug code and check for syntax errors
- All code was written by me :)

## Problems faced

Once again, the biggest problem here was spelling mismatch between the wesite API and component names and classes and id's
<br> ( We all know how amazing i am at typing)

## Whats left

- Making buy and sell possile
- Transactions update after buying and selling
- Making a dedicated portfolio and (maybe) transaction page
- Adding a FAVICON ( omgg i keep forgetting)


## And thats about it. Thanks for the read !