from django.urls import path
from . import views
from dashboard.api import *

urlpatterns = [
    path('dashboard/', views.dashboard_render, name='dashboard'),
    path('Client_dashboard/', views.dashboard_client_render, name='client_dashboard'),
    path('client/modal/', views.client_modal, name='client_modal'),
]

urlpatterns += [
    path('api/client/models/', get_client_models, name='api_client_models'),
    path('api/client/models/<int:model_id>/order/', check_order_for_color, name='check_order_for_color'),
    path('add-to-cart/',add_to_cart, name='add_to_cart'),
    path('cart-count/',get_cart_count, name='get_cart_count'),
    path('cart-items/',get_cart_items, name='get_cart_items'),
    path('update-cart/',update_cart_item, name='update_cart_item'),
    path('remove-from-cart/',remove_from_cart, name='remove_from_cart'),
    path('create-repeated-order/', create_repeated_order, name='create_repeated_order'),
    path('api/jewelry-types/', get_jewelry_types_simple, name='get_jewelry_types'),
]