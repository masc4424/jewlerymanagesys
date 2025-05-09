from django.shortcuts import render
from product_inv.models import *
import logging
# Initialize logger
log = logging.getLogger(__name__)

def order_list(request):
    return render(request, 'order_list.html')

def add_order(request):
    product_type = JewelryType.objects.all()
    log.info(f"product_type:{product_type}")
    return render(request, 'add_order.html', {'product_types': product_type})

def defective_order(request):
    return render(request, 'defective_order.html')

def repeted_order(request):
    return render(request, 'repeted_order.html')

def invoice_list(request):
    return render(request, 'invoice_list.html')

def invoice_add(request):
    return render(request,'invoice_add.html')