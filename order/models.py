from django.db import models
from django.core.validators import MinValueValidator
from datetime import date
from product_inv.models import *  # Importing Model from product_inv
from django.contrib.auth.models import User

class Order(models.Model):
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', null=True, blank=True)  # Made nullable for migration
    model = models.ForeignKey(Model, on_delete=models.CASCADE, related_name='orders')
    color = models.ForeignKey(ModelColor, on_delete=models.CASCADE, related_name='orders', null=True, blank=True)
    status = models.ForeignKey(ModelStatus, on_delete=models.SET_NULL, related_name='orders', null=True, blank=True)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    date_of_order = models.DateField(default=date.today)
    est_delivery_date = models.DateField()
    delivered = models.BooleanField(default=False)

    def __str__(self):
        client_name = self.client.username if self.client else "No Client"
        return f"Order {self.id} - {client_name} ({self.model.model_no})"


class RepeatedOrder(models.Model):
    original_order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='repeated_orders')
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='repeated_orders', null=True, blank=True)  # Made nullable for migration
    color = models.ForeignKey(ModelColor, on_delete=models.CASCADE, related_name='repeated_orders', null=True, blank=True)
    status = models.ForeignKey(ModelStatus, on_delete=models.SET_NULL, related_name='repeated_orders', null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    date_of_reorder = models.DateField(default=date.today)
    est_delivery_date = models.DateField(null=True, blank=True)
    repeat_order_id = models.CharField(max_length=50, null=True, blank=True)
    delivered = models.BooleanField(default=False)

    def __str__(self):
        client_name = self.client.username if self.client else "No Client"
        return f"Repeated Order - Original: {self.original_order.id}, Client: {client_name}"


class DefectiveOrder(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='defective_orders')
    repeated_order_id = models.CharField(max_length=50, null=True, blank=True)
    defective_pieces = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    issue_description = models.TextField()
    reported_date = models.DateField(default=date.today)
    defect_image = models.ImageField(upload_to='defective_orders/', blank=True, null=True)

    def __str__(self):
        return f"Defective Order {self.order.id} - {self.defective_pieces} pieces"

class ClientAddToCart(models.Model):
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='client_cart_items')
    model = models.ForeignKey(Model, on_delete=models.CASCADE, related_name='cart_items')
    color = models.ForeignKey(ModelColor, on_delete=models.CASCADE, related_name='cart_color', null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    date_added = models.DateTimeField(auto_now_add=True)
    order = models.ForeignKey('Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='cart_items')
    
    class Meta:
        ordering = ['-date_added']  # Order by most recent first
        
    def __str__(self):
        return f"{self.client.username} - {self.model.model_no} ({self.quantity})"