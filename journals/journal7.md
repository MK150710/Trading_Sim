# MASSIVE CHANGES
**Hours:** *10*

The list includes:
    - User data pulled form database instead of fake values 
    - Live market overview
    - Daily gainers and losers with live data
    - Sparklines and growth charts for all stocks
    - Watchlist dynamically rendered from user's database
    - Transactions rendered from database
    - Portfolio progression chart created from users previous net worths

## Disclaimer

These changes were meant to be distributed among two journals. But due to my absolutely amazing memory i forgot and created all these functions
Hence this devlong is gonna be a long one

## Changes in depth

### User data

- Earlier, on logging in, the user visited a dashboard with palceholder name, portfolio, networth etc. 
- This has been updated via the `dashboard_api` function in views.py to dynamically fetch user data

#### Problems faced

- Mismatch with the expected json data of the Backend meant that initially the data was not rendering properly, and just returning placeholder data

#### Current Bugs

- The way the data is saved daily means that there is virtually zero change in the net worth of the indivisual, atleast as far as this section is concerned
    - This causes the change and change percent to always remain at 0

### Market overview

- Yahoo's YFinance API endpoint has been used to get live market data of the `S&P500`, `NASDAQ` and `Dow Jones` ETFs. 
- This data is rendered through `markets.py` file inside services

#### Problems faced

- Initially, I thought of using finnhub as the provider due to its generous free tier and live data. 
    - This however did not work as the candles required to generate the sparkline of each graph were not included in the free tier of finnhub

- Next, i consider Alpha Vantage as my data provider. This idea was quickly scrapped due to its sparing free tier of 25 requests/day which would be exhausted in mere minutes
    - I briefly considered a mix of Finnhub and Alpha Vantage to get the best of both worlds, but the lag between responses and the limit for alpha vantage were still limiting

- So finally, i went with a mix of Finnhub and YFinance, and i thought it was the best combination. However, again, it lagged, it would not render properly. And besider, apart from the 15 mins delay, which, lets face it, is not game changing for a simulator, YFinance offered everything i needed, and also it had good documentation i could refer to

- My final data feed comes from YFinance and yahooquery, which I am quite proud of

#### Current Bugs

- Sometimes, there is still delay in the response, and im confused cause its very rare, and othertimes its not... Im still working on it


### Trending

- Trending API is still in progress, i havent been able to get it to work with the current data, but ill get it done by the next journal

### Progression Chart

- This is simply a chart that is dynamically created based on past portfolio worths of the user. 
- Not many problems were faced here, thank god. It was fairly strightforward

### Market movers

- The greatest gainers and losers, by day and percentage, are shown here. (Theyre the market movers after all 😅)
- This part was a considerable pain to get to work properly, particularly when i was using Finnhub, becuase it was very hard to find the gainers and losers, atleast for me.

#### Problems I faced

- Spellings mismatch with exact wording of the data the stock returned
- Issues with perfectly parsing it in the exact format required by JavaScript [What can i say, my typing is just that good]

- It was so bad that i did not even push my changes to github for this part

- YFinance for me somehow made this quite simpler and i was able to get it running.

- Thankfully, no errors presently

### Watchlist

- This was again, fairly straightforward. I simply got the values from the Datapased and parsed it instead of the placeholder array

#### Current Bugs

- While the stock listed is itself part of the users wishlist, the pricing, change percent and sparkline are currently totally fake 
- To fix this ill have to get the stock data update it in the database and create a function to do this every 10 miins or so


### Recent Transactions

- Here too, the data is simple parsed from backend and sybstituted instead of the placeholder array. 
- These values however in the database, are obviously made up. The purpose right now i to simply get the data, cause then if i upload it i am guaranteed to get it 

#### Problems faced

- The `Buy` tag inside the transactions section was very uncooperative
- I later realised that it was due to the capitalisation of the tag in the database wheras the JS reciever expected it in lowercase, and rejected it, hence printing it as sell



## Everything I learnt 

- API selection. Oh man! Theres so many parameters to check for and so many pros and cons and ups and downs. 
    - I should have probably evaluated all of that before actually starting to build the endpoint; It would probably have saved me an hour or two



- Capitalisation, i mean i knew it was important, but still. Spellings and capitalisation gave me a headache 😭😭😭
    ~ [ I really gotta improve my typing accuracy]

- Data sttructuring designs matter a lot more than i thought. When creating the dashboard, all i thought was, what all do i want. BUt then i realised alter, that its more about what all will the backend send and i should have structured it accoring to that; It would also have saved me some time

- Even tho i did plan everything well this time, i did slip out at a few places; like the 0 Change error in my main section is caused due to the way i made my backend


- There is a lot more, but most of it has been covered in the problems sections, which obviously meant learning about everything that meant wrong, so im not going to repeat it all here

## Role of AI

- During this time, AI did not write any code. ALl implementation is my own work; Ai merely acted as a debugger for some of my issues
- Moreover, it helped me progress though my plan in stages that actually made sense
- It also stored all of my past mistakes and issues and designs so i could easily refer them and write the code

### Next Steps

- First, obiviously, just fix all the bugs in the Updated version
- once thats done, i plan to create a way for users to actually quote and buy stocks. 
- I also want to create detailed amalysis pages for stocks dynamically, if possible ( I really hope i dont have to change APIs again 😭)

*Thanks for the read !!*