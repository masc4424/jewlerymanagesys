from django.urls import path
from .views import *
from .api import *

urlpatterns = [
    path('login/', login_auth_view, name='login_auth'),
]

urlpatterns += [
    path('login_api/', login_api, name='login_api'),
    path('logout/', logout_api, name='logout_api'),
]