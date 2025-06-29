from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Stone(models.Model):
    name = models.CharField(max_length=255)
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
    ]
    is_active = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='ACTIVE'
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_stone')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_stone')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class StoneType(models.Model):
    type_name = models.CharField(max_length=255)
    stone = models.ForeignKey(Stone, on_delete=models.CASCADE, related_name='types')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_stone_types')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_stone_types')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.type_name

class StoneTypeDetail(models.Model):
    # shape = models.CharField(max_length=255)
    length = models.CharField(max_length=255, default='N/A')  # Added default
    breadth = models.CharField(max_length=255, default='N/A')  # Added default
    weight = models.DecimalField(max_digits=10, decimal_places=2)
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    stone = models.ForeignKey(Stone, on_delete=models.CASCADE)
    stone_type = models.ForeignKey(StoneType, on_delete=models.CASCADE, related_name='details')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_stone_type_details')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_stone_type_details')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.length}x{self.breadth}"
        # return f"{self.shape} - {self.length}x{self.breadth}"

