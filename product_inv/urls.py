from django.urls import path
from product_inv.api import*
from product_inv.views import*

# render page
urlpatterns = [
    path('product/<str:model_no>/', product, name='product'),
    path('product_type', product_type, name='product_type'),
    path('product_list/<str:jewelry_type_name>/', product_list, name='product_list'),   
]

# api end point
urlpatterns += [
    path('stone-distribution/<str:model_no>/', stone_distribution_view, name='stone-distribution'),  
    path('jewelery_type/', get_jewelry_types_with_model_count, name='jewelery_type'),  
    path('get_model_data/<str:jewelry_type_name>/', get_models_by_jewelry_type, name='get_model_data'),  
    path('create_model/', create_model, name='create_model'),
    path('get_model/<int:model_id>/', get_model, name='get_model'),
    path('edit_model/', edit_model, name='edit_model'),
    path('delete_model/<int:model_id>/', delete_model, name='delete_model'),

]

