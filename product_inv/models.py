from django.db import models
from jewl_metals.models import *
from jewl_stones.models import *

class JewelryType(models.Model):
    name = models.CharField(max_length=255, unique=True)
    unique_id = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Model(models.Model):
    model_no = models.CharField(max_length=100, unique=True)
    length = models.DecimalField(max_digits=10, decimal_places=2)
    breadth = models.DecimalField(max_digits=10, decimal_places=2)
    weight = models.DecimalField(max_digits=10, decimal_places=2)
    model_img = models.ImageField(upload_to='models/')
    jewelry_type = models.ForeignKey(JewelryType, on_delete=models.CASCADE, related_name='models')

    def __str__(self):
        return self.model_no


class RawMaterial(models.Model):
    UNIT_CHOICES = [
        ('kg', 'Kilograms'),
        ('g', 'Grams'),
    ]

    model = models.ForeignKey(Model, on_delete=models.CASCADE, related_name='raw_materials')
    metal = models.ForeignKey(Metal, on_delete=models.CASCADE, related_name='raw_materials')
    weight = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=2, choices=UNIT_CHOICES, default='g')  # Default to grams

    def __str__(self):
        return f"{self.metal.name} ({self.metal.metal_unique_id}) for {self.model.model_no} - {self.weight}{self.unit}"
    
class RawStones(models.Model):
    model = models.ForeignKey(Model, on_delete=models.CASCADE, related_name='raw_stones')
    stone_type = models.ForeignKey(StoneType, on_delete=models.CASCADE, related_name='raw_stones')

    def __str__(self):
        return f"{self.stone_type.type_name} for {self.model.model_no}"