from django.urls import path
from .api import *

urlpatterns = [
    path('create-user/', create_user, name='create_user'),
    path('edit-user/<int:user_id>/', edit_user, name='edit_user'),
    path('delete-user/', delete_user, name='delete_user'),
    path('reset-password/', reset_password, name='reset_password'),
    path('create-role/', create_role, name='create_role'),
    path('delete-role/', delete_role, name='delete_role'),
    path('generate-reset-password-link/', generate_reset_password_link, name='generate_reset_password_link'),
]