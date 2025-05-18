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
    path('ajax/cart/<int:client_id>/', add_to_cart_side_view, name='ajax_add_to_cart_side'),
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
    path('cart/add/', add_to_cart_ajax, name='add_to_cart_ajax'),
    path('cart/count/<int:client_id>/', cart_item_count, name='cart_item_count'),
    path('api/cart/<int:client_id>/', get_cart_items, name='get_cart_items'),
    path('api/cart/delete/<int:item_id>/', delete_cart_item, name='delete_cart_item'),
    path('api/cart/proceed/', proceed_to_order, name='proceed_to_order'),
    path('api/cart/update_quantity/', update_cart_quantity, name='update_cart_quantity'),
    path('update_delivered/',   update_delivered, name='update_delivered'),
    path('update_model_status/', update_model_status, name='update_model_status'),

        # API endpoints for repeated orders
    # path('api/repeated-orders/', get_repeated_orders_api, name='api_repeated_orders'),
    path('api/repeated-orders/<int:order_id>/', get_repeated_order_details, name='api_repeated_order_details'),
    path('api/update-repeated-order-status/', update_repeated_order_status, name='api_update_repeated_order_status'),
    path('api/model-statuses/', get_model_statuses, name='api_model_statuses'),
    
    # Cart related URL
    path('api/add-to-cart/', add_to_cart_ajax, name='api_add_to_cart'),
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