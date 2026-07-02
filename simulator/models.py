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


    current_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=100000.00
    )

    STARTING_BALANCE = 100000

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

class Holding(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    symbol = models.CharField(
        max_length=8
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

        self.symbol = self.symbol.strip().upper()

        if self.quantity <= 0 and self.pk:
            self.delete()
            return

        else:
            self.avg_buy_price = self.total_investment/self.quantity

        super().save(*args, **kwargs)

    class Meta:
        
        constraints = [
            models.UniqueConstraint(
                fields=["portfolio", "symbol"], 
                name="unique_portfolio_symbol"
            )
        ]


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

    symbol = models.CharField(
        max_length=8
    )


    transaction_type = models.CharField(
        max_length=4,
        choices=TransactionType.choices,
        default=TransactionType.BUY
    )

    class Meta:
        constraints = [

            models.CheckConstraint(
                condition=models.Q(transaction_type__in=['BUY', 'SELL']),
                name='valid_transaction_type'
            )
        ]

    def save(self, *args, **kwargs):

        self.symbol = self.symbol.strip().upper()

        super().save(*args, **kwargs)

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

    symbol = models.CharField(
        max_length=8
    )

    added_at = models.DateTimeField(
        auto_now_add=True
    )

    def save(self, *args, **kwargs):

        self.symbol = self.symbol.strip().upper()

        super().save(*args, **kwargs)

    class Meta:
        
        constraints = [
            models.UniqueConstraint(
                fields=["user", "symbol"], 
                name="unique_user"
            )
        ]