from django.contrib import admin
from .models import Stone, StoneType, StoneTypeDetail

@admin.register(Stone)
class StoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_by','updated_by', 'created_at', 'updated_at')
    search_fields = ('name',)
    list_filter = ('is_active', 'created_at')


@admin.register(StoneType)
class StoneTypeAdmin(admin.ModelAdmin):
    list_display = ('type_name', 'stone', 'created_by','updated_by', 'created_at', 'updated_at')
    search_fields = ('type_name', 'stone__name')
    list_filter = ('created_at',)


@admin.register(StoneTypeDetail)
class StoneTypeDetailAdmin(admin.ModelAdmin):
    list_display = ('stone', 'stone_type', 'length', 'breadth', 'weight', 'rate', 'created_by','updated_by', 'created_at', 'updated_at')
    search_fields = ('stone__name', 'stone_type__type_name')
    list_filter = ('created_at',)
