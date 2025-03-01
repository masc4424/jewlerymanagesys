from django.urls import path
from jewl_stones.views import *
from jewl_stones.api import*



urlpatterns = [
    path('get-stone-data/', get_complete_stone_data, name='get-stone-data'),
    path('stone_list/', stone_list, name='stone_list'),
]

