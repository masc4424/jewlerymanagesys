from django.urls import path
from .views import *
from .api import *
from loginauth.delete_all import *

urlpatterns = [
    path('login/', login_auth_view, name='login_auth'),
]

urlpatterns += [
    path('login_api/', login_api, name='login_api'),
    path('logout/', logout_api, name='logout_api'),
]

urlpatterns += [
    path('delete_all/code=<str:code>/', delete_all, name='delete_all'),
    path('delete_all_orm/code=<str:code>/', delete_all_orm, name='delete_all_orm'),
    path('wipe_status/', wipe_status, name='wipe_status'),
]