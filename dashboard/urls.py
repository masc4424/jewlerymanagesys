from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_render, name='dashboard'),
    path('Client_dashboard/', views.dashboard_client_render, name='client_dashboard'),
]