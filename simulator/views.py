from django.shortcuts import render
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from .models import Portfolio, Holding, Stock, Transaction, Wishlist, DailySnapshot
from django.utils import timezone
import random
from datetime import timedelta
from .services.markets import markets
from django.core.cache import cache
from .services.base import get_screening
from .services.trending import get_trending_data
from .services.Stock_Page.header_data import header
from .services.Stock_Page.chart import get_chart
from .static.simulator.top_stocks import LANDING_STOCK_POOL
import random
import json
from django.shortcuts import get_object_or_404
from django.db import transaction
from .services.get_quote_data import get_data
from .services.create_new_stock import add_stock_to_supported_lists
from .services.Stock_Page.optimised import all_stock_data

# Create your views here.

def home(request):

    hero_symbols = {"NVDA", "AAPL", "TSLA"}

    ticker_order = [
        "AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "GOOGL",
        "META", "JPM", "V", "NFLX", "AMD"
    ]

    all_symbols = set(ticker_order)

    stocks = Stock.objects.filter(symbol__in=all_symbols)
    stock_map = {stock.symbol: stock for stock in stocks}

    hero = {}
    ticker = []

    for symbol in ticker_order:
        stock = stock_map[symbol]

        change = float(round(((stock.current_price - stock.previous_close) / stock.previous_close) * 100, 2))

        if symbol in hero_symbols:
            hero[symbol] = {
                "price" : float(stock.current_price),
                "change" : change,
            }

        ticker.append({
            "sym" : symbol,
            "price" : float(stock.current_price),
            "pct" : change
        })

    return render(request, "simulator/index.html", {
        "stock" : hero,
        "ticker" : ticker
    })
def register(request):
    if request.method == "GET":
        return render(request, "simulator/register.html")

    elif request.method == "POST":
        first_name = request.POST["first_name"]
        last_name = request.POST["last_name"]
        username = request.POST["username"]
        email = request.POST["email"]
        password = request.POST["password1"]
        check = request.POST["password2"]

        if password != check:
            return render(request, "simulator/register.html", {
                "error" : "Passwords do not match "
            })

        elif User.objects.filter(username=username).exists():
            return render(request, "simulator/register.html", {
                "error" : "Username Already Exists "
            })
        
        elif User.objects.filter(email=email).exists():
            return render(request, "simulator/register.html", {
                "error": "Email is already registered."
            })
        else:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )

            user.first_name = first_name
            user.last_name = last_name
            user.save()

            portfolio = Portfolio.objects.create(user=user)

            auth_login(request, user)
            return redirect("dashboard")


def login(request):
    
    if request.method == "GET":
        return render(request, "simulator/login.html")
    
    elif request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]

        user = authenticate(username=username, password=password)

        if user is not None:
            auth_login(request, user)
            return redirect("dashboard")

        else:
            return render(request, "simulator/login.html", {
                "error" : "Username or password incorrect"
            })
        
def logout(request):
    auth_logout(request)
    return redirect("home")

@login_required
def dashboard(request):
    return render(request, "simulator/dashboard.html",)

@login_required
def dashboard_api(request):
    user = request.user

    portfolio = Portfolio.objects.get(user=user)

    holdings = Holding.objects.filter(portfolio=portfolio)

    total_value = portfolio.current_balance
    for holding in holdings:
        stock = holding.stock
        price = stock.current_price

        price_of_holding = price * holding.quantity

        total_value += price_of_holding

    today = timezone.localdate()

    is_snapshot_today = DailySnapshot.objects.filter(user=user, date=today).exists()

    if not is_snapshot_today:

        cash = portfolio.current_balance
        investments = total_value - cash
        DailySnapshot.objects.create(
            user=user,
            date=today,
            cash=cash,
            investments=investments,
            net_worth=total_value
        )

    snapshot_today = DailySnapshot.objects.get(user=user, date=today)

    if snapshot_today.net_worth != 0: 
        percent_change = ((total_value - snapshot_today.net_worth) / snapshot_today.net_worth) * 100
    else:
        percent_change = 0

    return JsonResponse({
    "totalValue": float(total_value),
    "todayChange": total_value - snapshot_today.net_worth,
    "todayChangePercent": percent_change,
    "buyingPower": float(portfolio.current_balance),
    })


@login_required
def get_watchlist(request):
    user = request.user

    watchlist = Wishlist.objects.filter(user=user)
    data_list = []
    for item in watchlist:
        data = item.stock

        if data.previous_close:
            change_percent = ((data.current_price - data.previous_close) / data.previous_close) * 100
        else:
            change_percent = 0

        sparkline = data.sparkline
        if sparkline is None:
            base = data.current_price
            sparkline = [
                round(float(base) + random.uniform(-2, 2), 2)
                for _ in range(9)
            ]
            sparkline.append(base)
        
        data_dict = {
            "symbol" : data.symbol,
            "name" : data.company_name,
            "price" : data.current_price,
            "changePercent" : change_percent,
            "sparkline" : sparkline
        }

        data_list.append(data_dict)

    return JsonResponse(data_list, safe=False)

@login_required
def get_transactions(request):
    user = request.user

    portfolio = Portfolio.objects.get(user=user)

    transactions = (
        Transaction.objects
        .filter(portfolio=portfolio)
        .select_related("stock")
        .order_by("-traded_at")
    )

    transaction_list = []

    for t in transactions:
        stock = t.stock

        data_dict = {
            "symbol" : stock.symbol,
            "name" : stock.company_name,
            "type" : t.transaction_type.lower(),
            "shares" : t.shares_traded,
            "price" : t.price_on_trade,
            "total" : t.shares_traded * t.price_on_trade,
            "date" : t.traded_at.date()
        }

        transaction_list.append(data_dict)

    return JsonResponse(transaction_list, safe=False)

@login_required
def get_portfolio_history(request):

    timeline = request.GET.get("range", "3M")

    history = request.user.snapshots.order_by("date")

    today = timezone.localdate()

    if timeline == "1W":
        history = history.filter(date__gte=today - timedelta(days=7))
    elif timeline == "1M":
        history = history.filter(date__gte=today - timedelta(days=30))
    elif timeline == "3M":
        history = history.filter(date__gte=today - timedelta(days=90))
    elif timeline == "1Y":
        history = history.filter(date__gte=today - timedelta(days=365))

    history_data = []

    for hist in history:
        data_dict = {
            "date" : hist.date.isoformat(),
            "net_worth" : float(hist.net_worth),
        }
        
        history_data.append(data_dict)

    return JsonResponse(history_data, safe=False)


@login_required
def get_market_overview(request):

    overview = cache.get("markets_overview")

    if overview is None: 
        overview = markets()
        cache.set("markets_overview", overview, timeout=86400)

    return JsonResponse(overview, safe=False)

@login_required
def get_movers(request):
    losers = get_screening("day_losers")
    gainers = get_screening("day_gainers")

    def normalize(stocks):
        data_list = []

        for stock in stocks:
            data_list.append({
                "symbol": stock["symbol"],
                "name": stock["shortName"],
                "price": stock["regularMarketPrice"],
                "change": stock["regularMarketChange"],
                "changePercent": stock["regularMarketChangePercent"],
            })

        return data_list
    
    gainers = normalize(gainers)
    losers = normalize(losers)

    final_data = {
        "gainers" : gainers,
        "losers" : losers
    }

    return JsonResponse(final_data)

def get_trending(request):
    market_data = cache.get("trending_stocks")

    if market_data is None: 
        market_data = get_trending_data()
        cache.set("trending_stocks", market_data, timeout=43200)

    return JsonResponse(market_data, safe=False)

def landing_page_market(request):
    symbols = random.sample(LANDING_STOCK_POOL, 5)
    landing_data = []
    for symbol in symbols:
        stock = Stock.objects.get(symbol=symbol)
        change_p = round(float((stock.current_price - stock.previous_close) / stock.previous_close) * 100, 2)

        landing_data.append({
                "symbol": stock.symbol,
                "name" : stock.company_name,
                "current_price" : float(stock.current_price),
                "change_percent" : change_p,
                "volume" : stock.volume,
                "sparkline" : stock.sparkline
        })

    return JsonResponse(landing_data, safe=False)


@login_required
def render_stock_page(request, symbol):
    is_watclisted = Wishlist.objects.filter(
        user = request.user,
        stock__symbol=symbol.upper()
    ).exists()

    context = {
        'symbol': symbol.upper(),
        "is_watchlisted":is_watclisted
    }
    return render(request, 'simulator/stock_page.html', context)

@login_required
def get_stock_header(request, symbol):
    return JsonResponse(header(symbol))

@login_required
def get_stock_about(request, symbol):
    data = all_stock_data(symbol)
    return JsonResponse(data["about"])

@login_required
def get_stock_stats(request, symbol):
    data = all_stock_data(symbol)
    return JsonResponse(data["statistics"])

@login_required
def get_stock_news(request, symbol):
    data = all_stock_data(symbol)
    return JsonResponse(data["news"], safe=False)

@login_required
def get_stock_financials(request, symbol):
    data = all_stock_data(symbol)
    return JsonResponse(data["financials"], safe=False)

@login_required
def get_stock_orders(request, symbol):
    transactions = Transaction.objects.filter(
        portfolio = request.user.portfolio,
        stock__symbol__iexact = symbol
    ).order_by("-traded_at")

    orders = []

    for transaction in transactions:
        orders.append({
            "side":  transaction.transaction_type.lower(),
            "shares": transaction.shares_traded,
            "price": float(transaction.price_on_trade),
            "total": float(transaction.price_on_trade * transaction.shares_traded),
            "time": transaction.traded_at.strftime("%I:%M %p"),
            "date": transaction.traded_at.strftime("%b %d, %Y"),
        })

    return JsonResponse(orders, safe=False)

@login_required
def get_stock_chart(request, symbol):

    range_ = request.GET.get("range", "1M")
    return JsonResponse(get_chart(symbol, range_), safe=False)

@login_required
def get_stock_position(request, symbol):

    try:
        holding = Holding.objects.select_related("stock", "portfolio").get(
            portfolio__user=request.user,
            stock__symbol=symbol
        )

    except Holding.DoesNotExist:
        return JsonResponse(None, safe=False)

    total = holding.total_investment
    avgBuy = holding.avg_buy_price
    qty = holding.quantity
    current_price = holding.stock.current_price
    value = qty* current_price
    prev_close = holding.stock.previous_close
    unrealisedPL = value - total
    unrealisedPLPercent = (unrealisedPL / total) * 100
    today_returns = qty * (current_price - prev_close)

    portfolio = request.user.portfolio 
    portfolioValue = portfolio.current_balance + sum(
        h.quantity * h.stock.current_price
        for h in portfolio.holdings.select_related("stock")
    )

    allocationPercent = (value / portfolioValue) * 100

    return JsonResponse({
        "shares": qty,
        "avgCost": float(avgBuy),
        "totalInvested": float(total),
        "currentValue": float(value),
        "unrealizedPL": float(unrealisedPL),
        "unrealizedPLPercent": float(unrealisedPLPercent),
        "todayReturn": float(today_returns),
        "allocationPercent": float(allocationPercent), 
    })

@login_required
@require_POST
def watchlist_change(request):
    data = json.loads(request.body)

    symbol = data.get("symbol", "".upper())
    action = data.get("action")

    stock = get_object_or_404(Stock, symbol=symbol)

    if action == "add":
        Wishlist.objects.get_or_create(
            user = request.user,
            stock = stock
        )

    elif action == "remove":
        Wishlist.objects.filter(
            user = request.user,
            stock__symbol=symbol.upper()
        ).delete()

    else:
        return JsonResponse({"error": "Invalid action."}, status=400)

    return JsonResponse({"success": True})

@login_required
def get_stock_account_data(request, symbol):
    portfolio = Portfolio.objects.get(user = request.user)
    holding = portfolio.holdings.filter(stock__symbol=symbol).first()
    data = {
        "buyingPower": portfolio.current_balance,
        "sharesOwned": holding.quantity if holding else 0
    }

    return JsonResponse(data)


@require_POST
@login_required
def buy_and_sell(request):
    data = json.loads(request.body)

    side = data.get("side")
    quantity = data.get("quantity")
    symbol = data.get("stock")

    portfolio = Portfolio.objects.get(user=request.user)
    stock = Stock.objects.get(symbol=symbol)

    with transaction.atomic():

        quote = quantity * stock.current_price
        if side == "buy":

            holding, _ = Holding.objects.get_or_create(
                portfolio=portfolio, 
                stock=stock, 
                defaults={
                    "quantity": 0,
                    "total_investment": 0
                }
            )

            if portfolio.current_balance >= quote:
                holding.quantity += quantity
                holding.total_investment += quote
                holding.avg_buy_price = holding.total_investment / holding.quantity
                balance_before = portfolio.current_balance
                portfolio.current_balance -= quote

                Transaction.objects.create(
                    portfolio=portfolio,
                    stock=stock,
                    transaction_type="BUY",
                    shares_traded=quantity,
                    price_on_trade=stock.current_price,
                    balance_before=balance_before,
                    balance_after=portfolio.current_balance
                )
                status = True

                holding.save()
                portfolio.save()

            else:
                status = False

        elif side == "sell":
            holding = Holding.objects.filter(
                portfolio=portfolio,
                stock=stock
            ).first()

            if holding and holding.quantity >= quantity:
                holding.quantity -= quantity
                holding.total_investment -= quantity * holding.avg_buy_price

                balance_before = portfolio.current_balance

                portfolio.current_balance += quote

                Transaction.objects.create(
                    portfolio=portfolio,
                    stock=stock,
                    transaction_type="SELL",
                    shares_traded=quantity,
                    price_on_trade=stock.current_price,
                    balance_before=balance_before,
                    balance_after=portfolio.current_balance
                )

                status = True

                holding.save()
                portfolio.save()

            else:
                status = False


    return JsonResponse({
        "success": status,
        "side": side,
        "quantity": quantity,
        "stock": stock.symbol
    })


@login_required
def get_holdings(request):
    holdings = []
    portfolio = Portfolio.objects.get(user=request.user)
    all_holdings = Holding.objects.filter(portfolio=portfolio).order_by("stock__symbol")

    for holding in all_holdings:
        stock = holding.stock

        market_value = holding.quantity * stock.current_price
        profit_loss = market_value - holding.total_investment

        if holding.total_investment != 0:
            profit_loss_percent = (
                profit_loss / holding.total_investment
            ) * 100
        else:
            profit_loss_percent = 0

        data = {
            "symbol": stock.symbol,
            "name": stock.company_name,
            "price": stock.current_price,
            "quantity": holding.quantity,
            "avg_buy": holding.avg_buy_price,
            "total_investment": holding.total_investment,
            "market_val": market_value,
            "profit_loss": profit_loss,
            "profit_loss_percent": profit_loss_percent,
        }

        holdings.append(data)
    return render(request, "simulator/holdings.html", {
        "holdings": holdings
    })

@login_required
@require_POST
def check_new_stock(request):
    symbol = request.POST.get("symbol", "").strip().upper()
    try:
        data = get_data(symbol)
        if not data:
            pass

        data.pop("timezone", None)
        Stock.objects.create(**data)
        add_stock_to_supported_lists(symbol)
        context = {
            "symbol":symbol.upper()
        }
        return redirect("stock_detail", symbol=symbol)

    except Exception as e:
        return redirect("dashboard")

def get_health(request):
    return JsonResponse({"status": "ok"})