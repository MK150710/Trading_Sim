# Creating Django Models and Admin Page

**Hours:** *3.5*

## Objective

Create Django Models for backend foundation of TradeSims

---

## What I Worked On

- Wrote a markdown file first listing out all the models, fields, and relationships before touching code
- Translated that into models.py — ended up with 5 models: Portfolio, Stock, Holding, Transaction, Wishlist
  - Portfolio: one-to-one with User, starts everyone off with a $100k balance
  - Stock: symbol, price, exchange, etc.
  - Holding: links Portfolio + Stock, added a save() override so avg_buy_price calculates itself and the holding deletes itself if quantity hits 0
  - Transaction: logs every buy/sell with balance before/after so there's a proper trade history
  - Wishlist: User + Stock, made sure someone can't wishlist the same stock twice
- Used PROTECT on the Stock foreign keys so a stock can't get deleted while it's still tied to trades/holdings, but CASCADE on the Portfolio ones since those don't make sense without the parent
- Ran migrations, tested everything through the shell and admin
- Set up admin.py for all models + created a superuser

---

## What I Learnt

- on_delete matters more than I thought — CASCADE vs PROTECT changes a lot depending on whether the child record even makes sense without the parent
- Doing calculations (like avg_buy_price) inside save() keeps that logic in one place instead of copy-pasting it into views later
- Constraints like UniqueConstraint/CheckConstraint let the database stop bad data itself instead of relying only on form validation

---

## Problems & Rabbit Holes

- Migration broke when I swapped a CharField (was just storing the stock symbol as text) for a proper ForeignKey to Stock. Django had no way to map the existing text values to actual Stock rows, so it errored out
  - Fixed by wiping the db and remigrating since there was no real data yet — if this happens again later with actual data I'll need a proper data migration instead of just nuking it

---

## Functional Elements

- Fully working relational database — 5 models, all linked up properly with constraints
- Django Admin page working for all models
- Superuser set up

---

## Role of AI

- AI was used as a reviewer and technical mentor to validate database design decisions, strengthen Django concepts, and help debug migration issues. 
- All implementation and code integration were completed by me.

---

## Next Steps

- Connect backend to an API key to fetch live prices and make the site functional
- Start building the dashboard to show all data