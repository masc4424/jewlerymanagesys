from django.urls import path
from . import views
from dashboard.api import *

urlpatterns = [
    path('dashboard/', views.dashboard_render, name='dashboard'),
    path('Client_dashboard/', views.dashboard_client_render, name='client_dashboard'),
    path('client/modal/', views.client_modal, name='client_modal'),
]

urlpatterns += [
    path('api/client/models/', get_client_models, name='api_client_models'),
]