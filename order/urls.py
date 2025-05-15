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

#api
urlpatterns += [
    path('orders/json/', get_orders_json, name='get_orders_json'),
    path('client/<int:client_id>/models/', client_models, name='client_models'),
    path('orders/create/', create_orders, name='create_orders'),
    path('orders/update_status/', update_order_status, name='update_order_status'),
    path('orders/create_repeat_order/', create_repeat_order, name='create_repeat_order'),
    path('orders/update_order/', update_order, name='update_order'),
    path('orders/get_order/<int:order_id>/', get_order, name='get_order'),
    path('api/repeated-orders/', repeated_orders_data, name='repeated_orders_data'),
]