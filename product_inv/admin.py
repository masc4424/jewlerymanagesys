from django.contrib import admin
from .models import JewelryType, Model, ModelColor, RawMaterial, RawStones, StoneCount

@admin.register(JewelryType)
class JewelryTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'unique_id')
    search_fields = ('name', 'unique_id')


@admin.register(Model)
class ModelAdmin(admin.ModelAdmin):
    list_display = ('model_no', 'length', 'breadth', 'weight', 'jewelry_type')
    list_filter = ('jewelry_type',)
    search_fields = ('model_no',)


@admin.register(ModelColor)
class ModelColorAdmin(admin.ModelAdmin):
    list_display = ('model', 'color')
    list_filter = ('color',)
    search_fields = ('model__model_no', 'color')


@admin.register(RawMaterial)
class RawMaterialAdmin(admin.ModelAdmin):
    list_display = ('model', 'metal', 'weight', 'unit')
    list_filter = ('unit', 'metal')
    search_fields = ('model__model_no', 'metal__name')


@admin.register(RawStones)
class RawStonesAdmin(admin.ModelAdmin):
    list_display = ('model', 'stone_type')
    search_fields = ('model__model_no', 'stone_type__type_name')


@admin.register(StoneCount)
class StoneCountAdmin(admin.ModelAdmin):
    list_display = ('model', 'stone_type_details', 'count')
    search_fields = ('model__model_no', 'stone_type_details__stone_type__type_name')

