from django.urls import path
from order.api import*
from order.views import*

# view
urlpatterns = [
    path('order_list', order_list, name='orders'),
    path('add_order', add_order, name='add_order'),
    path('defective_order', defective_order, name='defective_order'),
    path('repeted_order', repeted_order, name='repeted_order'),
    path('invoices', invoice_list, name='invoices'),
    path('invoice_add', invoice_add, name='invoices'),
]

#crud api

urlpatterns += [
    path('orders_view/', orders_view, name='order_list'),         # List all orders
    path('orders/add/', order_add, name='order_add'),       # Add new order
    path('mark_order_delivered/', mark_order_delivered, name='mark_order_delivered'),
    path('orders/edit/<int:order_id>/', order_edit, name='order_edit'),  # Edit order
    path('delete_order/', order_delete, name='order_delete'),
    
    # New URLs for repeated orders
    path('add_to_repeat_orders/', add_to_repeat_orders, name='add_to_repeat_orders'),
    path('add_multiple_to_repeat_orders/', add_multiple_to_repeat_orders, name='add_multiple_to_repeat_orders'),
    path('get_repeated_orders/', get_repeated_orders, name='get_repeated_orders'),
    path('delete_repeated_order/', delete_repeated_order, name='delete_repeated_order'),
    
    # New URLs for defective orders
    path('get_defective_orders/', get_defective_orders, name='get_defective_orders'),
    path('add_defective_order/', add_defective_order, name='add_defective_order'),
    path('delete_defective_order/', delete_defective_order, name='delete_defective_order'),

]

#get api

urlpatterns += [
    path('get-model-color/<int:model_id>/', get_model_color, name='get_model_color'),
    path('get-models-by-type/<int:jewelry_type_id>/', get_models_by_type, name='get_models_by_type'),
]