from django.urls import path
from order.api import*
from order.views import*

# view
urlpatterns = [
    path('order_list', order_list, name='product'),
    path('add_order', add_order, name='product_list'),
    path('defective_order', defective_order, name='product_type'),
    path('repeted_order', repeted_order, name='product_type'),
]

#api