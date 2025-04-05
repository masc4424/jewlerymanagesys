from django.contrib import admin
from .models import Stone, StoneType, StoneTypeDetail


@admin.register(Stone)
class StoneAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)


@admin.register(StoneType)
class StoneTypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'type_name', 'stone')
    list_filter = ('stone',)
    search_fields = ('type_name',)


@admin.register(StoneTypeDetail)
class StoneTypeDetailAdmin(admin.ModelAdmin):
    list_display = ('id', 'stone', 'stone_type', 'length', 'breadth', 'weight', 'rate')
    list_filter = ('stone', 'stone_type')
    search_fields = ('stone__name', 'stone_type__type_name')
