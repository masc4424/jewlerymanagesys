from django.urls import path
from product_inv.api import*
from product_inv.views import*

# render page
urlpatterns = [
    path('product/<str:model_no>/', product, name='product'),
    path('product_list', product_list, name='product_list'),
    path('product_type', product_type, name='product_type'),
]

# api end point
urlpatterns += [
    path('stone-distribution/<str:model_no>/', stone_distribution_view, name='stone-distribution'),  
]

