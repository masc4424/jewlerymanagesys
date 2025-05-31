from django.urls import path
from product_inv.api import*
from product_inv.views import*

# render page
urlpatterns = [
    path('product/<str:model_no>/', product, name='product'),
    path('product_type', product_type, name='product_type'),
    path('product_list/<str:jewelry_type_name>/', product_list, name='product_list'),   
    path('create_new_model/<str:jewelry_type_name>/', create_new_model, name='create_new_model'),
    path('edit_model/<str:jewelry_type_name>/', edit_model_view, name='edit_model_view'),

]

# api end point
urlpatterns += [
    path('stone-distribution/<str:model_no>/', stone_distribution_view, name='stone-distribution'),  
    path('jewelery_type/', get_jewelry_types_with_model_count, name='jewelery_type'),  
    path('get_model_data/<str:jewelry_type_name>/', get_models_by_jewelry_type, name='get_model_data'),  
    path('create_model/', create_model, name='create_model'),
    path('get_model/<int:model_id>/', get_model, name='get_model'),
    # path('edit_model/', edit_model, name='edit_model'),
    path('delete_model/<int:model_id>/', delete_model, name='delete_model'),

    path('get_stones/', get_stones, name='get_stones'),
    path('get_stone_types/<int:stone_id>/', get_stone_types, name='get_stone_types'),
    path('get_stone_type_details/<int:type_id>/', get_stone_type_details, name='get_stone_type_details'),

    path('get_materials/', get_materials, name='get_materials'),
    path('get_material_rate/<int:metal_id>/', get_material_rate, name='get_material_rate'),
    path('create_jewelry_type/', create_jewelry_type, name='create_jewelry_type'),
    path('edit_jewelry_type/<int:id>/', edit_jewelry_type, name='create_jewelry_type'),
    path('delete_jewelry_type/<int:id>/', delete_jewelry_type, name='create_jewelry_type'),
    path('model_edit/<int:model_id>/', edit_model, name='edit_model'),
    path('get_model_details/<int:model_id>/', get_model_details, name='get_model_details'),
    path('get_clients/', get_clients, name='get_clients'),
    path('get_model_status/', get_model_status, name='get_model_status'),
    # Add this to your urls.py
    path('get_model_clients/<int:model_id>/', get_model_clients, name='get_model_clients'),
    path('download-sample-model-file/', download_sample_model_file, name='download_sample_model_file'),
    path('bulk-upload-models/', bulk_upload_models, name='bulk_upload_models'),

]

