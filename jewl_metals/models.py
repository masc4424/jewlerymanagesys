from django.db import models

class Metal(models.Model):
    UNIT_CHOICES = [
        ('gram', 'Gram'),
        ('kg', 'Kilogram'),
    ]

    metal_unique_id = models.CharField(max_length=50, unique=True)  # Custom unique ID for each metal
    name = models.CharField(max_length=100, unique=True)
    total_available_weight = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # Current inventory
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='kg')  # Default unit
    threshold_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # Minimum stock before warning
    threshold_unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='kg')  # Unit for threshold

    def __str__(self):
        return f"{self.metal_unique_id} - {self.name} - {self.total_available_weight} {self.unit} (Threshold: {self.threshold_limit} {self.threshold_unit})"

class MetalRate(models.Model):
    UNIT_CHOICES = [
        ('gram', 'Gram'),
        ('kg', 'Kilogram'),
    ]

    CURRENCY_CHOICES = [
        ('INR', 'Indian Rupee (₹)'),
        ('USD', 'US Dollar ($)'),
        ('EUR', 'Euro (€)'),
        ('GBP', 'British Pound (£)'),
        ('AUD', 'Australian Dollar (A$)'),
        ('CAD', 'Canadian Dollar (C$)'),
        ('JPY', 'Japanese Yen (¥)'),
        ('CNY', 'Chinese Yuan (¥)'),
    ]

    metal = models.ForeignKey(Metal, on_delete=models.CASCADE, related_name='rates')
    date = models.DateField(auto_now_add=True)
    weight = models.DecimalField(max_digits=10, decimal_places=2)  # Numeric weight value
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES)  # Choice field for unit
    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default='INR')  # Choice field for currency (default INR)
    rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        unique_together = ('metal', 'date', 'weight', 'unit', 'currency')  # Ensures unique rate per metal, per day, per weight & unit & currency

    def __str__(self):
        return f"{self.metal.metal_id} - {self.metal.name} - {self.date} - {self.weight} {self.unit} ({self.currency}): {self.rate or 'N/A'}"
