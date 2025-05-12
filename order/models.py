from django.db import models
from django.core.validators import MinValueValidator
from datetime import date
from product_inv.models import *  # Importing Model from product_inv

class Order(models.Model):
    client_name = models.CharField(max_length=255)
    order_unique_id = models.CharField(max_length=255, null=True, blank=True, default="")
    model = models.ForeignKey(Model, on_delete=models.CASCADE, related_name='orders')
    no_of_pieces = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    date_of_order = models.DateField(default=date.today)
    est_delivery_date = models.DateField()
    contact_no = models.CharField(max_length=15)
    mrp = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    color = models.ForeignKey(ModelColor, on_delete=models.CASCADE, related_name='orders')
    address = models.TextField(blank=True, null=True)
    is_delivered = models.BooleanField(default=False)

    def __str__(self):
        return f"Order {self.id} - {self.client} ({self.model.model_no})"


class RepeatedOrder(models.Model):
    order_unique_id = models.CharField(max_length=50, null=True, blank=True, default="")
    original_order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='repeated_orders')
    # new_order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='repeated_order_entry')
    date_of_reorder = models.DateField(default=date.today)
    est_delivery_date = models.DateField()  # Added estimated delivery date

    def __str__(self):
        return f"Repeated Order of {self.original_order.id} - New Order {self.new_order.id}"


class DefectiveOrder(models.Model):
    order_unique_id = models.CharField(max_length=50, null=True, blank=True, default="")
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='defective_orders')
    defective_pieces = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    issue_description = models.TextField()
    reported_date = models.DateField(default=date.today)
    defect_image = models.ImageField(upload_to='defective_orders/', blank=True, null=True)  # Added image field

    def __str__(self):
        return f"Defective Order {self.order.id} - {self.defective_pieces} pieces"

class ClientAddToCart(models.Model):
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='client_cart_items')
    model = models.ForeignKey(Model, on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.PositiveIntegerField(default=1)
    date_added = models.DateTimeField(auto_now_add=True)
    order_id = models.CharField(max_length=100, null=True, blank=True)  # Can be null as specified
    
    class Meta:
        ordering = ['-date_added']  # Order by most recent first
        
    def __str__(self):
        return f"{self.client.username} - {self.model.model_no} ({self.quantity})"