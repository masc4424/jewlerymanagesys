from django.contrib import admin
from .models import Order, RepeatedOrder, DefectiveOrder


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'client_name', 'order_unique_id', 'model', 'no_of_pieces',
        'date_of_order', 'est_delivery_date', 'contact_no', 'mrp', 'discount', 'color'
    )
    list_filter = ('date_of_order', 'est_delivery_date', 'model', 'color')
    search_fields = ('client_name', 'order_unique_id', 'contact_no', 'model__model_no')


@admin.register(RepeatedOrder)
class RepeatedOrderAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'order_unique_id', 'original_order', 'new_order',
        'date_of_reorder', 'est_delivery_date'
    )
    list_filter = ('date_of_reorder',)
    search_fields = ('order_unique_id', 'original_order__id', 'new_order__id')


@admin.register(DefectiveOrder)
class DefectiveOrderAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'order_unique_id', 'order', 'defective_pieces',
        'issue_description', 'reported_date'
    )
    list_filter = ('reported_date',)
    search_fields = ('order_unique_id', 'order__id', 'issue_description')
