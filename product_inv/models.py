from django.db import models
from jewl_metals.models import *
from jewl_stones.models import *
from django.contrib.auth.models import User
from django.utils import timezone

class JewelryType(models.Model):
    name = models.CharField(max_length=255, unique=True)
    unique_id = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class ModelStatus(models.Model):
    """
    A model to track status of various items in the system.
    """
    id = models.AutoField(primary_key=True)
    status = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Status: {self.status} (ID: {self.id})"
    
    class Meta:
        verbose_name = "Model Status"
        verbose_name_plural = "Model Statuses"

class Model(models.Model):
    model_no = models.CharField(max_length=100, unique=True)
    length = models.DecimalField(max_digits=10, decimal_places=2)
    breadth = models.DecimalField(max_digits=10, decimal_places=2)
    weight = models.DecimalField(max_digits=10, decimal_places=2)
    model_img = models.ImageField(upload_to='model_img/')
    jewelry_type = models.ForeignKey(JewelryType, on_delete=models.CASCADE, related_name='models')
    status = models.ForeignKey(ModelStatus, on_delete=models.SET_NULL, null=True, blank=True) 

    def __str__(self):
        return self.model_no

class ModelColor(models.Model):
    model = models.ForeignKey(Model, on_delete=models.CASCADE, related_name='model_colors')
    color = models.CharField(max_length=50)  # Text field for color

    class Meta:
        unique_together = ('model', 'color')  # Ensures a model can't have duplicate colors

    def __str__(self):
        return f"{self.model.model_no} - {self.color}"


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
    
class StoneCount(models.Model):
    id = models.AutoField(primary_key=True)
    count = models.IntegerField()
    stone_type_details = models.ForeignKey(StoneTypeDetail, on_delete=models.CASCADE, related_name='stone_counts')
    model = models.ForeignKey('Model', on_delete=models.CASCADE, related_name='stone_counts')
 
    def __str__(self):
        return f"{self.model.model_no} - {self.stone_type_details.stone_type.type_name} ({self.count})"

class ModelClient(models.Model):
    model = models.ForeignKey(Model, on_delete=models.CASCADE)
    client = models.ForeignKey(User, on_delete=models.CASCADE)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='modelclient_created_by')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='modelclient_updated_by')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('model', 'client')
        verbose_name = 'Model Client'
        verbose_name_plural = 'Model Clients'
    
    def __str__(self):
        return f"{self.model.model_no} - {self.client.username}"


