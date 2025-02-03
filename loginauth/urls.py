from django.urls import path
from .views import *

urlpatterns = [
    path('login/', login_auth_view, name='login_auth'),
]