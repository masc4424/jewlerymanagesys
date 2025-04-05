from django.contrib import admin
from .models import Metal, MetalRate


@admin.register(Metal)
class MetalAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'metal_unique_id', 'name', 'total_available_weight', 
        'unit', 'threshold_limit', 'threshold_unit'
    )
    search_fields = ('metal_unique_id', 'name')
    list_filter = ('unit',)


@admin.register(MetalRate)
class MetalRateAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'metal', 'date', 'weight', 'unit', 
        'currency', 'rate'
    )
    search_fields = ('metal__metal_unique_id', 'metal__name')
    list_filter = ('metal', 'unit', 'currency', 'date')
