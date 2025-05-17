from django.contrib import admin
from .models import *



@admin.register(JewelryType)
class JewelryTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'unique_id', 'created_by','updated_by', 'created_at', 'updated_at')
    search_fields = ('name', 'unique_id')
    list_filter = ('created_at',)


@admin.register(ModelStatus)
class ModelStatusAdmin(admin.ModelAdmin):
    list_display = ('id', 'status', 'created_at')
    search_fields = ('status',)
    list_filter = ('created_at',)


@admin.register(Model)
class ModelAdmin(admin.ModelAdmin):
    list_display = ('model_no', 'length', 'breadth', 'weight', 'jewelry_type', 'status')
    search_fields = ('model_no',)
    list_filter = ('jewelry_type', 'status')


@admin.register(ModelColor)
class ModelColorAdmin(admin.ModelAdmin):
    list_display = ('model', 'color')
    search_fields = ('model__model_no', 'color')
    list_filter = ('color',)


@admin.register(RawMaterial)
class RawMaterialAdmin(admin.ModelAdmin):
    list_display = ('model', 'metal', 'weight', 'unit')
    search_fields = ('model__model_no', 'metal__name')
    list_filter = ('unit',)


@admin.register(RawStones)
class RawStonesAdmin(admin.ModelAdmin):
    list_display = ('model', 'stone_type')
    search_fields = ('model__model_no', 'stone_type__type_name')


@admin.register(StoneCount)
class StoneCountAdmin(admin.ModelAdmin):
    list_display = ('model', 'stone_type_details', 'count')
    search_fields = ('model__model_no', 'stone_type_details__stone_type__type_name')


@admin.register(ModelClient)
class ModelClientAdmin(admin.ModelAdmin):
    list_display = ('model', 'client', 'created_by', 'created_at')
    search_fields = ('model__model_no', 'client__username')
    list_filter = ('created_at',)
