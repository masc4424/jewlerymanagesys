from django.shortcuts import render
from product_inv.models import *
from django.shortcuts import render, get_object_or_404

def product(request, model_no):
    product_obj = get_object_or_404(Model, model_no=model_no) 
    return render(request, 'product.html', {'product': product_obj})

def product_list(request):
    return render(request, 'product_list.html')

def product_type(request):
    return render(request, 'product_type.html')