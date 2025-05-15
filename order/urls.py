from django.urls import path
from order.api import*
from order.views import*
from order.client_order_api_views import *

# view
urlpatterns = [
    path('order_list', order_list, name='orders'),
    path('add_order', add_order, name='add_order'),
    path('defective_order', defective_order, name='defective_order'),
    path('repeted_order', repeted_order, name='repeted_order'),
    path('invoices', invoice_list, name='invoices'),
    path('invoice_add', invoice_add, name='invoices'),
    path('client_order_list', client_order_list, name='client_order_list'),
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

urlpatterns += [
    # Client order API endpoints
    path('api/client/orders/', client_orders_api, name='client_orders_api'),
    path('api/orders/<int:order_id>/approve/', approve_order, name='approve_order'),
    path('api/orders/<int:order_id>/deny/', deny_order, name='deny_order'),
    path('api/orders/<int:order_id>/return/', return_order, name='return_order'),
    path('api/repeated-orders/<int:order_id>/return/', return_order, name='return_repeated_order'),
    path('api/repeated-orders/<int:order_id>/cancel/', cancel_repeated_order, name='cancel_repeated_order'),
]