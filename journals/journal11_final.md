# ONE. LAST. DANCE

**Hours:** *12? 15? 20? (idek 😭😭)*

## What i did

Made the entire stock page have real data, you can actually buy and sell stocks now. This also updates transactions and holdings.

<br>

Brand new holdings page that shows every stock you own.

<br>

Finally, **MY WEBSITE IS DEPLOYED.**

Try it out now:

[Visit TradeSims](https://tradesims.onrender.com)

## All changes I made

### Buy and sell card

- This actually works now. YOu can buy and sell stocks
- It has both backend and frontend checks for buying and selling capacity
- Unlike last time it shouws different metrics in the buying and selling panel. Buying power if u wanna buy and stocks owned if you want to sell
- The buy and sell button also update transactions

### Holdings page

- Its a simple page where all stocks are mentioned with their values quantity and P/L incurred.
- Theres a button to access it from the hero on the dasboard

### Wishlist

- I thought it was complete alst time, but when i checked the dashoard i remembered the buttons id added to trending stocks for adding to wishlist

- This one was slightly hard to do as it took changes in both JS and Python. I faced another error with color of the start but that worked out

- This led me to my next problem

### Stocks not in database

- Whenever i called yfinance on dashboard for market movers and trending stocks it might not be in the database
- This led to issues whenever I tried to wishlist those stocks or visited them it failed

- Now Ive made a function to check if a stock is in the database, if its not, it updates top stocks and now it can be accessed

- The same goes for the search bar, if theres no stock present then you can search for it, and if yfin has it, it adds to stocks and is forever accessible and updates just like all other stocks


### Deploying

- This IS THE HARDEST PART OF ALL

- Im not even sure how its working. but it is

- Ive used redis and Supabase for the cache and database respiectively

- Redis is mostlyto recude dependence on yfinance so taht i can reduce requiests, prevent rate limiting

- And uptime robot is for monitoring and keeping the webstie up. 

Thats about it. Thanks for the read

# Tradesims is officialy LIVE