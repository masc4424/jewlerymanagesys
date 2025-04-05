from django.urls import path
from jewl_metals.views import *
from jewl_metals.api import *

urlpatterns = [
    # path('get-metal-prices/', get_metal_prices, name='get_metal_prices'),
    path('metal_list/', metal_list, name='metal_list'),
    path('api/metals/', get_metals_data, name='get_metals_data'),

    path('api/metals/add/', add_metal, name='add_metal'),
    path('api/metals/<int:metal_id>/update/', update_metal, name='update_metal'),
    path('api/metals/<int:metal_id>/delete/', delete_metal, name='delete_metal'),
    path('api/metals/<int:metal_id>/', get_metal_details, name='get_metal_details'),
    path('api/rates/add/', add_rate, name='add_rate'),
]