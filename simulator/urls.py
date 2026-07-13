from django.urls import path
from django.contrib import admin
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("register", views.register, name="register"),
    path("login", views.login, name="login"),
    path("admin/", admin.site.urls),
    path("logout", views.logout, name="logout"),
    path("dashboard", views.dashboard, name="dashboard"),
    path("api/portfolio", views.dashboard_api, name="portfolio_api"),
    path("api/watchlist", views.get_watchlist, name="watchlist_api"),
    path("api/transactions", views.get_transactions, name="transaction_api"),
    path("api/portfolio/history", views.get_portfolio_history, name="portfolio_history"),
    path("api/market", views.get_market_overview, name="market_overview_api"),
    path("api/movers", views.get_movers, name="market_movers"),
    path("api/trending", views.get_trending, name="trending_markets"),
    path("api/landing-market", views.landing_page_market, name="Landing_Page_market")
]