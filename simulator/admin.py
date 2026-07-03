from django.contrib import admin
from .models import Portfolio, Stock, Holding, Transaction, Wishlist

@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):

    list_display = (
        "user", 
        "current_balance", 
        "created_at", 
        "updated_at"
    )

    search_fields = (
        "user__username", 
        "user__email"
    )

    ordering = ("user__username",)


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):

    list_display = (
        "symbol",
        "company_name",
        "exchange", 
        "current_price",
        "previous_close",
        "is_featured",
        "last_updated"
    )

    search_fields = (
        "symbol",
        "company_name"
    )

    list_filter = (
        "exchange", 
        "is_featured"
    )

    list_editable = ("is_featured",)

    ordering = ("symbol",)

@admin.register(Holding)
class HoldingAdmin(admin.ModelAdmin):
    
    list_display = (
        "portfolio",
        "stock",
        "quantity",
        "avg_buy_price",
        "total_investment"
    )

    search_fields = (
        "portfolio__user__username",
        "stock__symbol",
        "stock__company_name",
    )

    list_filter = ("stock__exchange",)

    ordering = (
        "portfolio__user__username",
        "stock__symbol"
    )

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):

    list_display = (
        "portfolio",
        "stock",
        "transaction_type",
        "shares_traded",
        "price_on_trade",
        "balance_before",
        "balance_after",
        "traded_at"
    )

    search_fields = (
        "portfolio__user__username",
        "stock__symbol",
        "stock__company_name"
    )

    list_filter = (
        "transaction_type",
        "stock__exchange"
    )

    ordering = ("-traded_at",)

@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "stock",
        "added_at"
    )

    search_fields = (
        "user__username",
        "user__email",
        "stock__symbol",
        "stock__company_name"
    )

    list_filter = ("stock__exchange",)

    ordering = (
        "user__username",
        "stock__symbol"
    )