from django.shortcuts import render
from product_inv.models import *
from product_inv.api import *
from django.shortcuts import render, get_object_or_404

def product(request, model_no):
    product_obj = get_object_or_404(Model, model_no=model_no) 
    return render(request, 'product.html', {'product': product_obj})


def product_type(request):
    jewelry_data = get_jewelry_types_with_model_count(request)
    return render(request, 'product_type.html', {'jewelry_data': jewelry_data})

def product_list(request, jewelry_type_name):
    jewelry_type = get_object_or_404(JewelryType, name=jewelry_type_name)
    response = get_models_by_jewelry_type(request, jewelry_type.id)  # Pass the ID to your existing function
    models_data = response.content.decode('utf-8')
    return render(request, 'product_list.html', {
        'jewelry_type_name': jewelry_type_name,
        'jewelry_type_id': jewelry_type.id
    })

def create_new_model(request, jewelry_type_name):
    jewelry_type = get_object_or_404(JewelryType, name=jewelry_type_name)
    jewelry_type_id = jewelry_type.id
    return render(request, 'create_model.html', {
        'jewelry_type_id': jewelry_type_id, 
        'jewelry_type_name': jewelry_type_name  # Pass jewelry_type_name to template
    })

def edit_model_view(request, jewelry_type_name):
    jewelry_type = get_object_or_404(JewelryType, name=jewelry_type_name)
    jewelry_type_id = jewelry_type.id
    return render(request, 'edit_model.html', {
        'jewelry_type_id': jewelry_type_id, 
        'jewelry_type_name': jewelry_type_name  # Pass jewelry_type_name to template
    })