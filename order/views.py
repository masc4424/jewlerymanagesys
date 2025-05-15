from django.shortcuts import render
from product_inv.models import *
from user_role_management.models import *
import logging
# Initialize logger
log = logging.getLogger(__name__)

def order_list(request):
    # Fetch all statuses from ModelStatus table
    statuses = ModelStatus.objects.all()
    context = {
        'statuses': statuses
    }
    return render(request, 'order_list.html', context)

def add_order(request):
    try:
        client_role = Role.objects.get(role_name='Client')
        clients = User.objects.filter(userrole__role=client_role).distinct()
    except Role.DoesNotExist:
        clients = User.objects.none()
    return render(request, 'add_order.html', {'clients': clients})

def defective_order(request):
    return render(request, 'defective_order.html')

def repeted_order(request):
    return render(request, 'repeted_order.html')

def invoice_list(request):
    return render(request, 'invoice_list.html')

def invoice_add(request):
    return render(request,'invoice_add.html')