# TradeSims - Local Installation

If youre here, I guess you want to run TradeSims locally<br>
(Appreciate it 🫶)
<br><br>
Follow the steps below to get it fully set up and running

## 1. Clone the repository
```bash
git clone https://github.com/mk150710/trading_sim.git
cd trading_sim
```

## 2. Create the virtual environment

Create a virtual environment called `Prov_env` ( Very important, used by gitignore ):
```
python -m venv Proj_env
```
Activate it.

Windows:

```
Proj_env\Scripts\activate
```

Linux / macOS:

```bash
source Proj_env/bin/activate
```

## 3. Configure the environment

Copy `.env.example` to `.env`:

Windows:

```bash
copy .env.example .env
```

Linux / macOS / Terminal:

```bash
cp .env.example .env
```

Open the `.env` file and configure your Redis and PostgreSQL settings.

Redis is required for caching. You can get your link for free (30mb is enough) 

For Databsing, You can use either Local Postgress via PGAdmin or Supabase. setting up both will use supabase. For local, configure the four on top, or for supabase, just get your url


## 4. Install the requirements

When `Proj_env` is activated, run:

```bash
pip install -r requirements.txt
``` 

## 5. Make migrations

After configuring database: 

```bash
python manage.py makemigrations
```

Then:

```bash
python manage.py migrate
```

## 6. Start TradeSims

Run:

```bash
python manage.py runserver
```

The website should now be available at:

```text
http://127.0.0.1:8000/
```

## Important 

This is meant for you to experiment with the website. <br><br>
Dont push back to github please. <br><br>
Also, Dont deploy this website publically, as i have already. 
<br><br>
And for the love of god, dont try to turn it into a source of revenue, its meant to be an open source plattform for people to learn about trading
<br>
<br>
If you do however, feel that your addition to the website is really nice, you can reach out to me on [Instagram](https://www.instagram.com/maanvik_157/) anytime :)

## Thanks for supporting ✨
