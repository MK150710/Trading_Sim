# PostgreSQL

**Hours:** *1*

## Objective

Install PostgreSQL on my system and connect it to django

## What I did
Installed postgreSQL, created a new database, edited settings on github to use postgre instead of db.sqlite3, and created an env file to keep details safe. 

Connceted the database to Django App via psycopg driver. 

Used django-environ to store database credentials inside a .env file 

## Things I learnt

- Difference between postgress and SQLite, and choosing the better alternative

- How to connect a Django App to postgreSQL using psycopg and configure it through the DATABASES settings

- Why environment variables (.env) are important for keeping sensitive information like database credentials and the Django SECRET_KEY out of version control.

## Challenges faced

Initially, PostGRE refused to connect to my django app, however, after deleting the databse and creating a new one, it finally worked!