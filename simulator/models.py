from django.db import models
from django.conf import settings
import uuid

# Create your models here.

class Portfolio(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="portfolio"
    )

    STARTING_BALANCE = 100000

    current_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=STARTING_BALANCE
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.user.username}'s Portfolio"

class Stock(models.Model):

    id=models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    symbol = models.CharField(
        max_length=10,
        unique=True,
        db_index=True
    )

    company_name = models.CharField(
        max_length=100,
        db_index=True
    )

    current_price = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    exchange = models.CharField(
        max_length=20,
        default="NASDAQ"
    )

    previous_close = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    last_updated = models.DateTimeField(
        auto_now=True
    )

    is_featured = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.symbol} - {self.company_name}"
    

class Holding(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    stock = models.ForeignKey(
        Stock,
        on_delete=models.PROTECT,
        related_name="holdings"
    )
    
    total_investment = models.DecimalField(
        max_digits=12, 
        decimal_places=2
    )

    quantity = models.PositiveIntegerField()
    
    avg_buy_price = models.DecimalField(
        blank=True, 
        null=True,
        max_digits=8,
        decimal_places=2
    )

    portfolio = models.ForeignKey(
        Portfolio, 
        on_delete=models.CASCADE,
        related_name="holdings"
    )

    def save(self, *args, **kwargs):

        if self.quantity <= 0 and self.pk:
            self.delete()
            return

        else:
            self.avg_buy_price = self.total_investment/self.quantity

        super().save(*args, **kwargs)

    class Meta:
        
        constraints = [
            models.UniqueConstraint(
                fields=["portfolio", "stock"], 
                name="unique_portfolio_stock"
            )
        ]

    def __str__(self):
        return f"{self.portfolio.user.username} - {self.stock.symbol}"


class Transaction(models.Model):
    
    class TransactionType(models.TextChoices):
        BUY = 'BUY', 'Buy'
        SELL = 'SELL', 'Sell'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    portfolio = models.ForeignKey(
        Portfolio, 
        on_delete=models.CASCADE,
        related_name="transactions"
    )

    stock = models.ForeignKey(
        Stock,
        on_delete=models.PROTECT,
        related_name="transactions"
    )


    transaction_type = models.CharField(
        max_length=4,
        choices=TransactionType.choices,
        default=TransactionType.BUY
    )


    shares_traded = models.PositiveIntegerField()

    price_on_trade = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    balance_before = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    balance_after = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    traded_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [

            models.CheckConstraint(
                condition=models.Q(transaction_type__in=['BUY', 'SELL']),
                name='valid_transaction_type'
            )
        ]

    def __str__(self):
        return f"{self.transaction_type} {self.shares_traded} {self.stock.symbol}"
    
class Wishlist(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist"
    )

    stock = models.ForeignKey(
        Stock,
        on_delete=models.PROTECT,
        related_name="wishlists"
    )

    added_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        
        constraints = [
            models.UniqueConstraint(
                fields=["user", "stock"], 
                name="unique_user_stock"
            )
        ]

    def __str__(self):
        return f"{self.user.username} - {self.stock.symbol}"