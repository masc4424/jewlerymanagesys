from django.shortcuts import render, get_object_or_404, redirect
from order.models import *
from product_inv.models import *
from django.utils.dateparse import parse_date

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import F, Count, Sum
import json
from django.db import transaction

import uuid
from .models import Order
from django.utils.dateparse import parse_date

from django.templatetags.static import static

from django.utils import timezone

from datetime import date, timedelta
import os
import time

def orders_view(request):
    """
    Fetch all orders with calculation of selling price
    """
    orders = Order.objects.select_related("model", "color").annotate(
        model_no=F("model__model_no")
    ).values(
        "id", "client_name", "model_id", "model_no", "model__model_img", 
        "no_of_pieces", "date_of_order", "est_delivery_date", "contact_no", 
        "mrp", "discount", "color_id", "order_unique_id", "is_delivered"
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

@csrf_exempt
def mark_order_delivered(request):
    """
    Toggle an order's delivery status based on order_unique_id
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Only POST method is allowed'})

    order_unique_id = request.POST.get('order_unique_id')
    is_delivered = request.POST.get('is_delivered')
    
    # Convert string to boolean
    if is_delivered == 'true':
        is_delivered = True
    else:
        is_delivered = False
    
    if not order_unique_id:
        return JsonResponse({'success': False, 'error': 'Order ID is required'})
    
    try:
        with transaction.atomic():
            # Get all orders with this unique ID
            orders = Order.objects.filter(order_unique_id=order_unique_id)
            
            if not orders.exists():
                return JsonResponse({'success': False, 'error': 'Order not found'})
            
            # Update the delivery status for all orders with this unique ID
            orders.update(is_delivered=is_delivered)
            
            return JsonResponse({'success': True})
    
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
    
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
def order_delete(request):
    if request.method == 'POST':
        order_unique_id = request.POST.get('order_unique_id')
        try:
            order = get_object_or_404(Order, order_unique_id=order_unique_id)
            order.delete()
            return JsonResponse({'success': True, 'message': 'Order deleted'})
        except:
            return JsonResponse({'success': False, 'error': 'Order not found'}, status=404)
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@csrf_exempt
def add_to_repeat_orders(request):
    if request.method == 'POST':
        order_unique_id = request.POST.get('order_unique_id')
        try:
            original_orders = Order.objects.filter(order_unique_id=order_unique_id)
            
            if not original_orders.exists():
                return JsonResponse({'success': False, 'error': 'Order not found'})
            
            new_unique_id = f"REP-{order_unique_id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"

            for original_order in original_orders:
                RepeatedOrder.objects.create(
                    order_unique_id=new_unique_id,
                    original_order=original_order,
                    est_delivery_date=date.today() + timedelta(days=30)
                )

            return JsonResponse({'success': True, 'message': 'Order added to repeat orders successfully'})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@csrf_exempt
def add_multiple_to_repeat_orders(request):
    if request.method == 'POST':
        order_unique_ids = request.POST.getlist('order_unique_ids[]')
        
        if not order_unique_ids:
            return JsonResponse({'success': False, 'error': 'No orders selected'})
        
        success_count = 0
        errors = []
        
        for unique_id in order_unique_ids:
            try:
                # Get all orders with this unique ID
                original_orders = Order.objects.filter(order_unique_id=unique_id)
                
                if not original_orders.exists():
                    errors.append(f"Order {unique_id} not found")
                    continue
                
                # Create new orders as copies of the originals
                new_orders = []
                new_unique_id = f"REP-{unique_id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                
                for original_order in original_orders:
                    
                    # Create RepeatedOrder entry linking old and new order
                    RepeatedOrder.objects.create(
                        order_unique_id=new_unique_id,
                        original_order=original_order,
                        est_delivery_date=date.today() + timedelta(days=30)
                    )
                
                success_count += 1
                    
            except Exception as e:
                errors.append(f"Error processing order {unique_id}: {str(e)}")
        
        result = {
            'success': success_count > 0,
            'message': f"{success_count} orders successfully added to repeat orders"
        }
        
        if errors:
            result['errors'] = errors
            
        return JsonResponse(result)
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

def get_repeated_orders(request):
    repeated_orders = RepeatedOrder.objects.all().select_related('original_order')

    data = []
    for repeated_order in repeated_orders:
        # Get all original orders using the original order_unique_id
        original_orders = Order.objects.filter(order_unique_id=repeated_order.original_order.order_unique_id)

        # Get all repeated orders using the RepeatedOrder's own order_unique_id
        repeated_order_entries = Order.objects.filter(order_unique_id=repeated_order.order_unique_id)

        # Totals for original order group
        original_total_pieces = sum(order.no_of_pieces for order in original_orders)
        original_total_mrp = sum(float(order.mrp) * order.no_of_pieces for order in original_orders)

        # Totals for repeated order group
        repeated_total_pieces = sum(order.no_of_pieces for order in repeated_order_entries)
        repeated_total_mrp = sum(float(order.mrp) * order.no_of_pieces for order in repeated_order_entries)

        data.append({
            'id': repeated_order.id,
            'original_order_id': repeated_order.original_order.order_unique_id,
            'client_name': repeated_order.original_order.client_name,
            'date_of_reorder': repeated_order.date_of_reorder.strftime('%Y-%m-%d'),
            'est_delivery_date': repeated_order.est_delivery_date.strftime('%Y-%m-%d'),
            'original_pieces': original_total_pieces,
            'new_pieces': repeated_total_pieces,
            'original_mrp': original_total_mrp,
            'new_mrp': repeated_total_mrp,
            'contact_no': repeated_order.original_order.contact_no
        })

    return JsonResponse(data, safe=False)

@csrf_exempt
def add_defective_order(request):
    if request.method == 'POST':
        order_unique_id = request.POST.get('order_unique_id')
        defective_pieces = request.POST.get('defective_pieces')
        issue_description = request.POST.get('issue_description')
        
        try:
            order = Order.objects.filter(order_unique_id=order_unique_id).first()
            
            if not order:
                return JsonResponse({'success': False, 'error': 'Order not found'})
            
            defective_order = DefectiveOrder.objects.create(
                order_unique_id=order_unique_id,
                order=order,
                defective_pieces=defective_pieces,
                issue_description=issue_description,
                reported_date=date.today()
            )
            
            if 'defect_image' in request.FILES:
                image_file = request.FILES['defect_image']

                # Construct the path relative to the app's directory
                from django.conf import settings
                app_static_dir = os.path.join(settings.BASE_DIR, 'order', 'static', 'defective_orders')
                
                if not os.path.exists(app_static_dir):
                    os.makedirs(app_static_dir)
                
                # Create a unique filename
                filename = f"defect_{order_unique_id}_{int(time.time())}{os.path.splitext(image_file.name)[1]}"
                file_path = os.path.join(app_static_dir, filename)
                
                # Save the file
                with open(file_path, 'wb+') as destination:
                    for chunk in image_file.chunks():
                        destination.write(chunk)
                
                # Save the relative path in the model
                defective_order.defect_image = f"defective_orders/{filename}"
                defective_order.save()
            
            return JsonResponse({'success': True, 'message': 'Defective order reported successfully'})
        
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

def get_defective_orders(request):
    defective_orders = DefectiveOrder.objects.all().select_related('order')
    
    data = []
    for defective_order in defective_orders:
        image_url = None
        if defective_order.defect_image:
            image_url = static(defective_order.defect_image)  # Use the static helper
        
        data.append({
            'id': defective_order.id,
            'order_unique_id': defective_order.order_unique_id,
            'client_name': defective_order.order.client_name,
            'model_no': defective_order.order.model.model_no,
            'defective_pieces': defective_order.defective_pieces,
            'issue_description': defective_order.issue_description,
            'reported_date': defective_order.reported_date.strftime('%Y-%m-%d'),
            'image_url': image_url,
            'contact_no': defective_order.order.contact_no
        })
    
    return JsonResponse(data, safe=False)

@csrf_exempt
def delete_repeated_order(request):
    if request.method == 'POST':
        repeated_order_id = request.POST.get('repeated_order_id')
        try:
            repeated_order = RepeatedOrder.objects.get(id=repeated_order_id)
            repeated_order.delete()
            return JsonResponse({'success': True, 'message': 'Repeated order entry deleted successfully'})
        except RepeatedOrder.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Repeated order entry not found'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@csrf_exempt
def delete_defective_order(request):
    if request.method == 'POST':
        defective_order_id = request.POST.get('defective_order_id')
        try:
            defective_order = DefectiveOrder.objects.get(id=defective_order_id)
            defective_order.delete()
            return JsonResponse({'success': True, 'message': 'Defective order report deleted successfully'})
        except DefectiveOrder.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Defective order report not found'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

