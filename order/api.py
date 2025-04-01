from django.shortcuts import render, get_object_or_404, redirect
from order.models import *
from product_inv.models import *
from django.utils.dateparse import parse_date

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import F
import json

from django.templatetags.static import static

def order_view(request):
    orders = Order.objects.select_related("model").annotate( model_no=F("model__model_no")).values(
        "id", "client_name", "model_id", "model_no", "model__model_img", 
        "no_of_pieces", "date_of_order", "est_delivery_date", "contact_no", 
        "mrp", "discount", "color_id"
    )

    orders_list = []
    for order in orders:
        mrp = float(order["mrp"])
        discount = float(order["discount"])
        selling_price = mrp - (mrp * discount / 100)  # Apply discount percentage
        order["selling_price"] = round(selling_price, 2)  # Round to 2 decimal places

        # Fix the image URL for static files
        if order["model__model_img"]:
            order["model_img"] = request.build_absolute_uri(static(order["model__model_img"]))
        else:
            order["model_img"] = None  # Handle missing image
        
        del order["model__model_img"]
        orders_list.append(order)

    return JsonResponse(orders_list, safe=False)

# Add Order
@csrf_exempt
def order_add(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            order = Order.objects.create(
                client_name=data['client_name'],
                model_id=data['model'],
                no_of_pieces=data['no_of_pieces'],
                date_of_order=parse_date(data['date_of_order']),
                est_delivery_date=parse_date(data['est_delivery_date']),
                contact_no=data['contact_no'],
                mrp=data['mrp'],
                discount=data.get('discount', 0.00),
                color_id=data['color']
            )
            return JsonResponse({'message': 'Order created', 'order_id': order.id}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

def get_model_color(request, model_id):
    model = get_object_or_404(Model, id=model_id)  # Fetch by primary key (id)
    colors = model.model_colors.values_list('color', flat=True)
    return JsonResponse({'model_id': model.id, 'colors': list(colors)})

def get_models_by_type(request, jewelry_type_id):
    jewelry_type = get_object_or_404(JewelryType, id=jewelry_type_id)  # Fetch by primary key (id)
    models = jewelry_type.models.values('id', 'model_no', 'length', 'breadth', 'weight', 'model_img')
    return JsonResponse({'jewelry_type': jewelry_type.name, 'models': list(models)})

# Edit Order
@csrf_exempt
def order_edit(request, order_id):
    order = get_object_or_404(Order, id=order_id)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            order.client_name = data['client_name']
            order.model_id = data['model']
            order.no_of_pieces = data['no_of_pieces']
            order.date_of_order = parse_date(data['date_of_order'])
            order.est_delivery_date = parse_date(data['est_delivery_date'])
            order.contact_no = data['contact_no']
            order.mrp = data['mrp']
            order.discount = data.get('discount', 0.00)
            order.color_id = data['color']
            order.save()
            return JsonResponse({'message': 'Order updated'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

# Delete Order
@csrf_exempt
def order_delete(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    if request.method == 'DELETE':
        order.delete()
        return JsonResponse({'message': 'Order deleted'})

    return JsonResponse({'error': 'Invalid request method'}, status=405)

