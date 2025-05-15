# admin.py for the order app
from django.contrib import admin
from .models import Order, RepeatedOrder, DefectiveOrder

class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'id', 
        'client',  # Changed from client_name
        'model',   # This is the ForeignKey to Model
        'date_of_order', 
        'quantity',  # Changed from no_of_pieces
        'est_delivery_date',
        'delivered',  # Changed from is_delivered
        'color'
    ]
    list_filter = ['date_of_order', 'est_delivery_date', 'delivered', 'color']
    search_fields = ['client__username', 'model__model_no']  # Updated to search through related fields

class RepeatedOrderAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'original_order',
        'client',
        'date_of_reorder',
        'est_delivery_date',
        'repeat_order_id'
    ]
    list_filter = ['date_of_reorder', 'est_delivery_date']
    search_fields = ['original_order__id', 'client__username', 'repeat_order_id']

class DefectiveOrderAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'order',
        'repeated_order_id',
        'defective_pieces',
        'reported_date'
    ]
    list_filter = ['reported_date']
    search_fields = ['order__id', 'repeated_order_id', 'issue_description']

admin.site.register(Order, OrderAdmin)
admin.site.register(RepeatedOrder, RepeatedOrderAdmin)
admin.site.register(DefectiveOrder, DefectiveOrderAdmin)