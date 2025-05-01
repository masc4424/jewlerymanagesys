from django.urls import path
from user_role_management.api import *
from user_role_management.views import *
from user_role_management.client_api import *

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('create-user/', create_user, name='create_user'),
    path('edit-user/<int:user_id>/', edit_user, name='edit_user'),
    path('delete-user/', delete_user, name='delete_user'),
    path('reset-password/', reset_password, name='reset_password'),
    # path('create-role/', create_role, name='create_role'),
    # path('delete-role/', delete_role, name='delete_role'),
    path('generate-reset-password-link/', generate_reset_password_link, name='generate_reset_password_link'),
    path('user_table/', user_table, name='user_table'),
    path('get_users/', get_users, name='get_users'),
    # path('get-roles/', get_roles, name='get_roles'),

        # View URLs
    path('role_list/', role_list, name='role_list'),
    path('client_table/', client_users, name='user_table'),
    
    # API URLs - using your existing functions
    path('api/roles/', get_roles, name='get_roles'),
    path('api/create_role/', create_role, name='create_role'),
    path('api/delete_role/', delete_role, name='delete_role'),
    path('api/update_role/', update_role, name='update_role'),

    # For API endpoints client
    path('api/get_client_users/', get_client_users, name='get_client_users'),
    path('api/add_client_user/', add_client_user, name='add_client_user'),
    path('api/edit_client_user/', edit_client_user, name='edit_client_user'),
    path('api/delete_client_user/', delete_client_user, name='delete_client_user'),
]

urlpatterns += [
    path('update-profile-image/', update_profile_image, name='update_profile_image'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)