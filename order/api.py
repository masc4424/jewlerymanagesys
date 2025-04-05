from django.shortcuts import render, get_object_or_404, redirect
from order.models import *
from product_inv.models import *
from django.utils.dateparse import parse_date

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import F
import json

import uuid
from .models import Order
from django.utils.dateparse import parse_date

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
            # Parse the incoming JSON data
            data = json.loads(request.body)

            # Extract necessary fields
            client_name = data['client_name']
            contact_no = data['contact_no']
            address = data['address']
            date_of_order = parse_date(data['date_of_order'])
            est_delivery_date = parse_date(data['est_delivery_date'])
            order_number = data['order_number']
            items = data['items']
            item_order = data.get('item_order')

            # Create orders for each item
            created_orders = []
            
            for item in items:
                # Create the order
                order = Order.objects.create(
                    client_name=client_name,
                    model_id=item['model'],
                    no_of_pieces=item['no_of_pieces'],
                    date_of_order=date_of_order,
                    est_delivery_date=est_delivery_date,
                    contact_no=contact_no,
                    address=address,
                    mrp=item['mrp'],
                    discount=item.get('discount', 0.00),
                    color_id=item['color']
                )

                # Generate unique ID for each order
                unique_id = generate_unique_id(client_name, item_order, date_of_order)
                
                # Update the order with the unique_id
                order.order_unique_id = unique_id
                order.save()
                
                created_orders.append({
                    'order_id': order.id,
                    'order_unique_id': unique_id
                })

            return JsonResponse({
                'message': 'Orders created successfully', 
                'orders': created_orders,
                'count': len(created_orders)
            }, status=201)
            
        except KeyError as e:
            return JsonResponse({'error': str(e)}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

def generate_unique_id(customer_name, order_id, date_of_order):
    # Extract the first four letters of the customer's name
    name_part = customer_name[:4].upper()  # Convert to uppercase for consistency
    
    # Use the order ID directly as a string
    order_id_part = str(order_id)  # Ensure order_id is a string
    
    # Format the date of order as DDMMYYYY
    date_part = date_of_order.strftime('%d%m%Y')
    
    # Combine parts to create the unique ID
    unique_id = f"{name_part}_{order_id_part}_{date_part}"
    
    return unique_id

def get_model_color(request, model_id):
    model = get_object_or_404(Model, id=model_id)
    colors = model.model_colors.all().values('id', 'color')
    formatted_colors = [{'id': c['id'], 'name': c['color']} for c in colors]
    return JsonResponse({'model_id': model.id, 'colors': formatted_colors})


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

