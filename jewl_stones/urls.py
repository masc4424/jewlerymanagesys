from django.urls import path
from .views import *



urlpatterns = [
    path('get-stone-data/', get_complete_stone_data, name='get-stone-data'),
    path('stone_list/', stone_list, name='stone_list'),
    path('stone-distribution/<str:model_no>/', stone_distribution_view, name='stone-distribution'),
   
]

