from django.urls import path
from order.api import*
from order.views import*

# view
urlpatterns = [
    path('order_list', order_list, name='product'),
    path('add_order', add_order, name='product_list'),
    path('defective_order', defective_order, name='product_type'),
    path('repeted_order', repeted_order, name='product_type'),
    path('invoices', invoice_list, name='invoices'),
    path('invoice_add', invoice_add, name='invoices'),
]

#crud api

urlpatterns += [
    path('orders_view/', order_view, name='order_list'),         # List all orders
    path('orders/add/', order_add, name='order_add'),       # Add new order
    path('orders/edit/<int:order_id>/', order_edit, name='order_edit'),  # Edit order
    path('orders/delete/<int:order_id>/', order_delete, name='order_delete'),  # Delete order
]

#get api

urlpatterns += [
    path('get-model-color/<int:model_id>/', get_model_color, name='get_model_color'),
    path('get-models-by-type/<int:jewelry_type_id>/', get_models_by_type, name='get_models_by_type'),
]