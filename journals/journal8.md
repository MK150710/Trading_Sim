# Bug Fixes and live data

**Hours:** *9*

## What all I completed

- All Bugs mentioned in the previous devlog have been fixed.
- All data related to stocks (except for login page) has been connected to stock database so that all data is live 
- Created multiple components for stock details and page ( in development )

## Changes in details 

### Live data

- Finnhub API was scrapped to use only YFinance as the main Data provider.
- A task was scheduled to run every 5 minutes to update all data to stock database
- Instead of all pages calling the API for live data, all pages ping the database, which is updated as mentioned above

## Bug Fixes

### Live data

Pages that now have live data:
    - Landing page ( Markets page and moving section )
    - Watchlist part
    - Trending stocks ( With sparklines )
    - Floating stock cards

### Problems faced

- I sometimes got timed out cause I called the API too many times
- I had to switch to the database metnod so i could reduce api queries. 

### User button

- This was a small fix, but took a surprising amount of time 😭😭
- The logout button is now hidden under the user initial button on top right 

### File cleanup

- Extra blocks of code, specifically fake js data was removed
- Fairly strightforward

### Stock listing page

- This is still in development
- I have created multiple components
    - Navbar
    - Details
    - Right panel
        - Buy and sell stocks
        - Related stocks
        - User Ownership
    - Left panel
        - Stock progression chart
        - Conpany overview
        - Finance
        - Company News
        - Statistics
        - Order History

All compoenents come together inside a stock page that will be displayed

- This page is stil under development. 
- I am planning to only use fake data for now, the i will slowly progress to real data from API and database

- There is very little js that i have written for this part till now, but there are more files planed


## Everything I learnt

- Its best to store all data from apis specially if multiple pages need to visit it, cause well then it doesnt reach limit. 

- Revised JS and how to put together animations

- Again, I already listed everything I learnt and did in the bug fixes :)

## Role of AP

- AI only helped he understand the error specifics
- All code is written by me

## Current bugs

- The stock page is not complete(it is far from done)
- I dont have any rn but theyll pop up

## Next steps

- Complete the stock page 
- Connect it to the database
- Allow for buying and selling 
- FIX ALL BUGS ( They always come )

Thats about it !! Thanks for the read