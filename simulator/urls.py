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
    path("api/landing-market", views.landing_page_market, name="Landing_Page_market"),
    path('stock/<str:symbol>/', views.render_stock_page, name='stock_detail'),
    path('stock/<str:symbol>/data/header', views.get_stock_header, name='stock_header'),
    path('stock/<str:symbol>/data/about', views.get_stock_about, name='stock_about'),
    path('stock/<str:symbol>/data/stats', views.get_stock_stats, name='stock_stats'),
    path('stock/<str:symbol>/data/news', views.get_stock_news, name='stock_news'),
    path('stock/<str:symbol>/data/financials', views.get_stock_financials, name='stock_financials'),
    path('stock/<str:symbol>/data/chart', views.get_stock_chart, name='stock_chart'),
    path('stock/<str:symbol>/data/order_hist', views.get_stock_orders, name='stock_order'),
    path('stock/<str:symbol>/data/position', views.get_stock_position, name='stock_position'),
    path('stock/data/watchlist', views.watchlist_change, name='change_watchlist'),
    path('stock/<str:symbol>/data/user_details', views.get_stock_account_data, name='account_data'),
    path('stock/data/trade', views.buy_and_sell, name='trade_shares'),
]