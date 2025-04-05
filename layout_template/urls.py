from django.urls import path
from layout_template.api import *

urlpatterns = [
    path('change-password/', change_password, name='change_password'),
]