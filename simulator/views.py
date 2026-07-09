from django.shortcuts import render
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import Portfolio, Holding, Stock, Transaction, Wishlist, DailySnapshot
from django.utils import timezone
import random
from datetime import timedelta
# Create your views here.

def home(request):
    return render(request, "simulator/index.html")

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
    print("Request user:", request.user)
    print("Authenticated:", request.user.is_authenticated)

    user = request.user

    watchlist = Wishlist.objects.filter(user=user)
    data_list = []
    for item in watchlist:
        data = item.stock

        if data.previous_close:
            change_percent = ((data.current_price - data.previous_close) / data.previous_close) * 100
        else:
            change_percent = 0

        base = data.current_price
        sparkline = [
            round(float(base) + random.uniform(-2, 2), 2)
            for _ in range(9)
        ]

        sparkline.append(base)
        
        data_dict = {
            "symbol" : data.symbol,
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

