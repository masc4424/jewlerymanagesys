from django.shortcuts import render
from product_inv.models import *
from product_inv.api import *
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required

import logging
log = logging.getLogger(__name__)

@login_required(login_url='login_auth')
def product(request, model_no):
    product_obj = get_object_or_404(Model, model_no=model_no)
    jewelry_type = product_obj.jewelry_type  # Access the related JewelryType object

    raw_materials = product_obj.raw_materials.all()
    raw_stones = product_obj.raw_stones.all()

    return render(request, 'product.html', {
        'product': product_obj,
        'jewelry_type': jewelry_type,
        'raw_materials': raw_materials,
        'raw_stones': raw_stones,
    })


@login_required(login_url='login_auth')
def product_type(request):
    jewelry_data = get_jewelry_types_with_model_count(request)
    return render(request, 'product_type.html', {'jewelry_data': jewelry_data})

@login_required(login_url='login_auth')
def product_list(request, jewelry_type_name):
    jewelry_type = get_object_or_404(JewelryType, name=jewelry_type_name)
    response = get_models_by_jewelry_type(request, jewelry_type.id)  # Pass the ID to your existing function
    models_data = response.content.decode('utf-8')
    return render(request, 'product_list.html', {
        'jewelry_type_name': jewelry_type_name,
        'jewelry_type_id': jewelry_type.id
    })

@login_required(login_url='login_auth')
def create_new_model(request, jewelry_type_name):
    jewelry_type = get_object_or_404(JewelryType, name=jewelry_type_name)
    jewelry_type_id = jewelry_type.id
    return render(request, 'create_model.html', {
        'jewelry_type_id': jewelry_type_id, 
        'jewelry_type_name': jewelry_type_name  # Pass jewelry_type_name to template
    })

@login_required(login_url='login_auth')
def edit_model_view(request, jewelry_type_name):
    jewelry_type = get_object_or_404(JewelryType, name=jewelry_type_name)
    model_id = request.GET.get('model_id')
    model = get_object_or_404(Model, id=model_id, jewelry_type=jewelry_type)

    log.info(f"Edit model view accessed for jewelry_type_name: {jewelry_type_name}, model_id: {model_id}")

    return render(request, 'edit_model.html', {
        'jewelry_type_id': jewelry_type.id,
        'jewelry_type_name': jewelry_type.name,
        'model_id': model_id,
        'model': model  # passing model instance
    })