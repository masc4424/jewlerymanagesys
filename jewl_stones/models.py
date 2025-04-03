from django.db import models

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

    def __str__(self):
        return self.name


class StoneType(models.Model):
    type_name = models.CharField(max_length=255)
    stone = models.ForeignKey(Stone, on_delete=models.CASCADE, related_name='types')

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

    def __str__(self):
        return f"{self.shape} - {self.length}x{self.breadth}"

