from django.db import models

class Stone(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class StoneType(models.Model):
    stone = models.ForeignKey(Stone, on_delete=models.CASCADE, related_name='types')
    type_name = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.type_name} ({self.stone.name})"

class StoneTypeDetail(models.Model):
    stone_type = models.ForeignKey(StoneType, on_delete=models.CASCADE, related_name='details')
    stone = models.ForeignKey(Stone, on_delete=models.CASCADE)
    shape = models.CharField(max_length=255)
    size = models.CharField(max_length=255)
    weight = models.DecimalField(max_digits=10, decimal_places=2)
    rate = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.stone.name} - {self.shape} - {self.size}"
