from django.urls import path
from .api import *

urlpatterns = [
    path('api/get-metal-rates/', metal_rates_api, name='get_metal_rates'),
    path('get-prices/', get_metal_prices, name='get_metal_prices'),
]