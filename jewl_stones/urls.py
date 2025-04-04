from django.urls import path
from jewl_stones.views import *
from jewl_stones.api import*



urlpatterns = [
    path('get-stone-data/', get_complete_stone_data, name='get-stone-data'),
    path('stone_list/', stone_list, name='stone_list'),
    path('create-stone/', create_stone, name='create_stone'),
    path('stone-types/', stone_type_view, name='stone_types'),
    path('get-stone-type-data/', get_stone_type_data, name='get-stone-type-data'),
    path('create-stone-type/', create_stone_type, name='create_stone_type'),
    path('stone-type-details/', stone_type_detail_view, name='stone_type_details'),
    path('get-stone-type-detail-data/', get_stone_type_detail_data, name='get_stone_type_detail_data'),
    path('create-stone-type-detail/', create_stone_type_detail, name='create_stone_type_detail'),
    path('update-stone/', update_stone, name='update_stone'),
    path('delete-stone/', delete_stone, name='delete_stone'),
    path('update-stone-type/', update_stone_type, name='update_stone_type'),
    path('delete-stone-type/', delete_stone_type, name='delete_stone_type'),
    path('get-stone-type-detail/<int:detail_id>/', get_stone_type_detail, name='get_stone_type_detail'),
    path('update-stone-type-detail/<int:detail_id>/', update_stone_type_detail, name='update_stone_type_detail'),
    path('delete-stone-type-detail/<int:detail_id>/', delete_stone_type_detail, name='delete_stone_type_detail'),
]


