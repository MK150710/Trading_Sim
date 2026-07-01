# Design for codebase

This document describes the database schema used by TradeSims. It is intended to act as a base for designing the final structure implemented in django models

## User 

### Purpose

Use Django's built-in User table to store all important user data safely


### Includes:
    - User details
        - First Name
        - Last name
        - Email ID
        - Phone no. (optional)
        - Username
        - Password (Hashed)

### Relationships

- [Portfolio](#portfolio) [ One to One ] 
- [Wishlist](#wishlist) [ One to Many ]

## Portfolio

### Purpose

- Represents the User's Paper Trading account
- Holds The value of current portfolio and cash-in-hand

### Includes:
    - User (OneToOneField)
    - Cash Balance
    - Initial Balance
    - Created At
    - Updated At

### Relationships:

- [User](#user) [ One to One ]
- [Stock Holdings](#holdings) [ One to Many ]

## Holdings

### Purpose

- Tracks all current stock holdings and investments of user
- Related them to portfolio of user

### Includes:
    - Stock Symbol
    - No. Of stocks
    - Total Invested amount
    - Average Buying Price

### Relationships:

- [Portfolio](#portfolio) [ Many to One ]


## Transactions

### Purpose

- Records entire history of all transactions of a given portfolio

### Includes:
    - Transaction ID
    - Stock Symbol
    - Transaction type (Buy or Sell)
    - No. of shares bought/sold
    - Price per Share at time of Buying
    - Cash Balance before trade
    - Cash balance after trade
    - Date and Time of trade
### Relationships:

- [Portfolio](#portfolio) [ Many to One ]


## Wishlist

### Purpose

- Stores all the Stocks a user wishes to track. 


### Includes
    - Stock symbol
    - Added at

### Relationship

- [User](#user) [ Many to One ]