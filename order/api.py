from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.templatetags.static import static
from django.contrib.auth.decorators import login_required
from django.utils.timezone import now
from django.http import JsonResponse
from order.models import *
from product_inv.models import *
import json
from datetime import date, timedelta, datetime
from django.db.models import Sum
from django.contrib.auth import get_user_model
from django.db import transaction

# @csrf_exempt
# @require_http_methods(["GET", "POST"])
# def get_orders_json(request):
#     if request.method == "POST":
#         try:
#             body = json.loads(request.body)
#             order_id = body.get('order_id')
#             status_id = body.get('status_id')
            
#             if not order_id or not status_id:
#                 return JsonResponse({'error': 'Missing order_id or status_id'}, status=400)

#             order = get_object_or_404(Order, id=order_id)
#             status = get_object_or_404(ModelStatus, id=status_id)

#             order.status = status
#             order.save()

#             return JsonResponse({'success': True, 'message': 'Order status updated successfully.'})
#         except json.JSONDecodeError:
#             return JsonResponse({'error': 'Invalid JSON'}, status=400)
#         except Exception as e:
#             return JsonResponse({'error': str(e)}, status=500)

#     # GET logic (original code)
#     orders = Order.objects.all().select_related('client', 'model', 'color', 'status')
#     data = []

#     for i, order in enumerate(orders, start=1):
#         repeated_orders = order.repeated_orders.all()
#         total_repeats = repeated_orders.count()
#         delivered_repeats = repeated_orders.filter(delivered=True).count()
#         in_progress = total_repeats - delivered_repeats

#         model_no = order.model.model_no if order.model else "N/A"
#         weight = order.model.weight if order.model else "N/A"

#         model_image = ""
#         if order.model and order.model.model_img:
#             model_image = static(f"model_img/{order.model.model_img.name.split('/')[-1]}")

#         status_text = order.status.status if order.status else "N/A"
#         status_id = order.status.id if order.status else None

#         data.append({
#             'sl_no': i,
#             'model_no': model_no,
#             'model_image': model_image,
#             'client': f"{order.client.first_name} {order.client.last_name}" if order.client else "No Client",
#             'status': status_text,
#             'status_id': status_id,
#             'quantity': order.quantity,
#             'delivered': 'Yes' if order.delivered else 'No',
#             'repeated_order': total_repeats,
#             'in_progress': in_progress,
#             'weight': weight,
#             'color': order.color.color if order.color else "N/A",
#             'delivery_date': order.est_delivery_date.strftime("%Y-%m-%d"),
#             'order_id': order.id,
#         })

#     return JsonResponse({'data': data})

@csrf_exempt
@require_http_methods(["GET", "POST"])
def get_orders_json(request):
    if request.method == "POST":
        try:
            body = json.loads(request.body)
            order_id = body.get('order_id')
            status_id = body.get('status_id')

            if not order_id or not status_id:
                return JsonResponse({'error': 'Missing order_id or status_id'}, status=400)

            order = get_object_or_404(Order, id=order_id)
            status = get_object_or_404(ModelStatus, id=status_id)

            order.status = status
            order.save()

            return JsonResponse({'success': True, 'message': 'Order status updated successfully.'})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    # GET logic (with grouping functionality)
    orders = Order.objects.all().select_related('client', 'model', 'color', 'status')
    
    # Create a dictionary to group orders
    grouped_orders = {}
    
    # Group orders by client, date_of_order, and model_no
    for order in orders:
        client_id = order.client.id if order.client else None
        client_name = f"{order.client.first_name} {order.client.last_name}" if order.client else "No Client"
        date_of_order = order.date_of_order.strftime("%Y-%m-%d")
        model_no = order.model.model_no if order.model else "N/A"
        model_id = order.model.id if order.model else "N/A"
        
        # Create a unique key for grouping
        group_key = f"{client_id}_{date_of_order}_{model_no}"
        
        if group_key not in grouped_orders:
            grouped_orders[group_key] = {
                'client': client_name,
                'client_id': client_id,
                'date_of_order': date_of_order,
                'model_id':model_id,
                'model_no': model_no,
                'orders': [],
                'total_quantity': 0,
                'total_delivered': 0,
                'total_repeated_orders': 0,
                'total_in_progress': 0,
                'weight': order.model.weight if order.model else "N/A",
                'model_image': ""
            }
            
            # Set model image for the group
            if order.model and order.model.model_img:
                grouped_orders[group_key]['model_image'] = static(f"model_img/{order.model.model_img.name.split('/')[-1]}")
        
        # Calculate order details
        repeated_orders = order.repeated_orders.all()
        total_repeats = repeated_orders.count()
        delivered_repeats = repeated_orders.filter(delivered=True).count()
        in_progress = total_repeats - delivered_repeats
        
        # Update group totals
        grouped_orders[group_key]['total_quantity'] += order.quantity
        grouped_orders[group_key]['total_delivered'] += 1 if order.delivered else 0
        grouped_orders[group_key]['total_repeated_orders'] += total_repeats
        grouped_orders[group_key]['total_in_progress'] += in_progress
        
        # Add individual order details to the group
        # Make sure to get status from the model properly
        status_text = order.model.status.status if order.model and hasattr(order.model, 'status') and order.model.status else "N/A"
        status_id = order.model.status.id if order.model and hasattr(order.model, 'status') and order.model.status else None
        
        grouped_orders[group_key]['orders'].append({
            'order_id': order.id,
            'status': status_text,
            'status_id': status_id,
            'quantity': order.quantity,
            'delivered': 'Yes' if order.delivered else 'No',
            'repeated_order': total_repeats,
            'in_progress': in_progress,
            'color': order.color.color if order.color else "N/A",
            'delivery_date': order.est_delivery_date.strftime("%Y-%m-%d"),
        })
    
    # Convert dictionary to list for response
    data = []
    for i, (_, group) in enumerate(grouped_orders.items(), start=1):
        group_data = {
            'sl_no': i,
            'client': group['client'],
            'client_id': group['client_id'],
            'date_of_order': group['date_of_order'],
            'model_id': group['model_id'],
            'model_no': group['model_no'],
            'model_image': group['model_image'],
            'quantity': group['total_quantity'],
            'delivered_count': group['total_delivered'],
            'repeated_order': group['total_repeated_orders'],
            'in_progress': group['total_in_progress'],
            'weight': group['weight'],
            'orders': group['orders']
        }
        data.append(group_data)

    statuses = list(ModelStatus.objects.all().values('id', 'status'))
    
    return JsonResponse({'data': data, 'statuses': statuses})

@require_POST
@csrf_exempt  # Note: It's better to handle CSRF properly in production
def delete_order(request):
    """
    View function to delete an order.
    Expects a JSON payload with order_id.
    """
    try:
        # Parse the JSON data from the request
        data = json.loads(request.body)
        order_id = data.get('order_id')
        
        if not order_id:
            return JsonResponse({'status': 'error', 'message': 'Order ID is required'}, status=400)
        
        # Try to find the order
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Order not found'}, status=404)
        
        # Store order details for logging
        order_model = order.model.model_no if hasattr(order, 'model') and order.model else 'N/A'
        order_color = order.color if hasattr(order, 'color') else 'N/A'
        
        # Delete the order with transaction to ensure atomicity
        with transaction.atomic():
            # Optional: Add any additional cleanup logic here
            # For example, you might want to update model status or inventory
            
            # Delete the order
            order.delete()
        
        # Log the deletion (optional)
        # You can replace this with your logging system
        print(f"Order #{order_id} (Model: {order_model}, Color: {order_color}) was deleted by user {request.user.username}")
        
        return JsonResponse({
            'status': 'success',
            'message': f'Order #{order_id} has been deleted successfully'
        })
    
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    
    except Exception as e:
        # Log the error
        print(f"Error deleting order: {str(e)}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

def client_models(request, client_id):
    model_clients = ModelClient.objects.filter(client_id=client_id).select_related('model__status')
    models = []

    for mc in model_clients:
        model = mc.model
        colors = ModelColor.objects.filter(model=model).values('id', 'color')

        image_path = static(f"model_img/{model.model_img.name.split('/')[-1]}") if model.model_img else ""

        models.append({
            'id': model.id,
            'length': model.length,
            'breadth': model.breadth,
            'model_no': model.model_no,
            'weight': str(model.weight),
            'image': image_path,
            'colors': list(colors),
            'status_name': model.status.status if model.status else "N/A"
        })

    return JsonResponse({'models': models})

@csrf_exempt
def create_orders(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        client_id = data.get('client_id')
        orders = data.get('orders', [])
        for o in orders:
            Order.objects.create(
                client_id=client_id,
                model_id=o['model_id'],
                color_id=o['color_id'],
                quantity=o['quantity'],
                est_delivery_date=date.today() + timedelta(days=7)  # or use your logic
            )
        return JsonResponse({'message': 'Orders created successfully!'})

@require_POST
@csrf_exempt
def update_order_status(request):
    try:
        data = json.loads(request.body)
        order_id = data.get('order_id')
        status_id = data.get('status_id')
        est_delivery_date = data.get('est_delivery_date')
        
        # Get the order
        order = Order.objects.get(id=order_id)
        
        # Update the status
        status = ModelStatus.objects.get(id=status_id)
        order.status = status
        
        # Update the estimated delivery date
        if est_delivery_date:
            order.est_delivery_date = est_delivery_date
        
        # Save the changes
        order.save()
        
        return JsonResponse({'success': True, 'message': 'Order status updated successfully'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

def create_repeat_order(request):
    """
    API endpoint to create a repeat order based on an existing order
    """
    data = json.loads(request.body)
    original_order_id = data.get('order_id')
    quantity = data.get('quantity')
    est_delivery_date = data.get('est_delivery_date')
    
    try:
        original_order = Order.objects.get(id=original_order_id)
        
        # Create new repeated order entry
        new_order = RepeatedOrder(
            original_order=original_order,
            client=original_order.client,
            color=original_order.color,
            status=original_order.status,
            quantity=quantity,
            quantity_delivered=0,  # New order starts with 0 delivered
            est_delivery_date=est_delivery_date,
            delivered=False  # New order should not be delivered
        )
        new_order.save()
        
        # Generate repeat order ID (e.g., "R-{original_id}-{repeat_id}")
        new_order.repeat_order_id = f"R-{original_order.id}-{new_order.id}"
        new_order.save()
        
        return JsonResponse({
            'status': 'success', 
            'message': 'Repeat order created successfully',
            'order_id': new_order.id,
            'repeat_order_id': new_order.repeat_order_id
        })
    except Order.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Original order not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@ensure_csrf_cookie
def get_orders_data(request):
    """
    API endpoint to get order data for the DataTable
    """
    # This function would return data for the DataTable
    # Implement filtering, pagination as needed based on DataTables requirements
    
    # Example implementation
    models = Model.objects.all().prefetch_related('orders')
    
    data = []
    for i, model in enumerate(models):
        orders = []
        for order in model.orders.all():
            orders.append({
                'order_id': order.id,
                'color': order.color.name if order.color else 'N/A',
                'quantity': order.quantity,
                'quantity_delivered': order.quantity_delivered,
                'delivery_date': order.est_delivery_date.isoformat() if order.est_delivery_date else None,
                'status': order.status.name if order.status else 'N/A',
                'delivered': 'Yes' if order.delivered else 'No',
                'client': order.client.username if order.client else 'N/A'
            })
            
        model_data = {
            'sl_no': i + 1,  # Serial number for the table
            'model_id': model.id,
            'model_no': model.model_no,
            'orders': orders,
            'status': model.status.name if model.status else 'N/A'
        }
        data.append(model_data)
        
    return JsonResponse({
        'data': data
    })
            
@require_POST
def update_order(request):
    """
    API endpoint to update an order's quantity, delivery date, and quantity delivered
    """
    data = json.loads(request.body)
    order_id = data.get('order_id')
    quantity = data.get('quantity')
    est_delivery_date = data.get('est_delivery_date')
    quantity_delivered = data.get('quantity_delivered')
    
    try:
        order = Order.objects.get(id=order_id)
        
        if quantity:
            order.quantity = quantity
        
        if est_delivery_date:
            order.est_delivery_date = est_delivery_date
            
        if quantity_delivered is not None:
            order.quantity_delivered = quantity_delivered
            # Automatically set delivered flag if all units are delivered
            order.delivered = (order.quantity_delivered >= order.quantity)
            
        order.save()
        
        return JsonResponse({'status': 'success', 'message': 'Order updated successfully'})
    except Order.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Order not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

def update_delivered(request):
    """
    API endpoint to update an order's delivery status and quantity delivered
    """
    data = json.loads(request.body)
    order_id = data.get('order_id')
    delivered = data.get('delivered')
    quantity_delivered = data.get('quantity_delivered')
    
    try:
        order = Order.objects.get(id=order_id)
        
        if delivered is not None:
            order.delivered = delivered
            # If marked delivered and quantity_delivered isn't specified, set it to full quantity
            if delivered and quantity_delivered is None:
                order.quantity_delivered = order.quantity
        
        if quantity_delivered is not None:
            order.quantity_delivered = quantity_delivered
        
        order.save()
        
        return JsonResponse({'status': 'success', 'message': 'Delivery status updated successfully'})
    except Order.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Order not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@require_POST
def update_model_status(request):
    """
    API endpoint to update a model's status
    """
    try:
        data = json.loads(request.body)
        model_id = data.get('model_id')
        status_id = data.get('status_id')
        
        print(f"Received request to update model: {model_id} to status: {status_id}")
        
        if not model_id:
            return JsonResponse({'status': 'error', 'message': 'model_id is required'}, status=400)
        
        if not status_id:
            return JsonResponse({'status': 'error', 'message': 'status_id is required'}, status=400)
        
        # Try to get the model with more diagnostics
        try:
            model = Model.objects.get(id=model_id)
        except Model.DoesNotExist:
            print(f"Model with ID {model_id} not found in database")
            # Try to list some models to debug
            model_count = Model.objects.count()
            sample_models = list(Model.objects.all()[:5].values_list('id', flat=True))
            print(f"Total models in DB: {model_count}, Sample IDs: {sample_models}")
            return JsonResponse({
                'status': 'error', 
                'message': f'Model with ID {model_id} not found'
            }, status=404)
        
        # Update the model status
        model.status_id = status_id
        model.save()
        
        return JsonResponse({
            'status': 'success', 
            'message': f'Model status updated successfully to {status_id}'
        })
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    except Exception as e:
        import traceback
        print(f"Error updating model status: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

def get_order(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        
        # Return order details
        return JsonResponse({
            'order_id': order.id,
            'client_id': order.client.id if order.client else None,
            'model_id': order.model.id if order.model else None,
            'model_no': order.model.model_no if order.model else "N/A",
            'color_id': order.color.id if order.color else None,
            'color': order.color.color if order.color else "N/A",
            'quantity': order.quantity,
            'est_delivery_date': order.est_delivery_date.strftime("%Y-%m-%d"),
            'delivered': order.delivered
        })
    
    except Order.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Order not found'
        }, status=404)
    
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)
    
def repeated_orders_data(request):
    repeated_orders = RepeatedOrder.objects.select_related(
        'original_order__model__jewelry_type',
        'original_order__model__status',
        'original_order__model',
        'color',
        'status',
        'client',
        'original_order'
    ).all()

    data = []
    for ro in repeated_orders:
        model = ro.original_order.model
        # Get client name - use full name if available, otherwise username
        client_name = 'N/A'
        if ro.client:
            client_name = ro.client.get_full_name() or ro.client.username
            
        # Handle model image path
        model_img_url = ''
        if model.model_img and model.model_img.name:
            model_img_url = static(f"model_img/{model.model_img.name.split('/')[-1]}")
        
        data.append({
            'id': ro.id,  # Adding ID for action buttons
            'model_no': model.model_no,
            'model_img': model_img_url,
            'status_name': ro.status.status if ro.status else (model.status.status if model.status else 'N/A'),
            'status_id': ro.status.id if ro.status else None,
            'jewelry_type': model.jewelry_type.name,
            'quantity': ro.quantity,
            'quantity_delivered': ro.quantity_delivered,
            'color_name': ro.color.color if ro.color else 'N/A',
            'color': ro.color.color if ro.color else '',
            'client_name': client_name,  # Adding client name
            'order_date': ro.date_of_reorder.strftime('%Y-%m-%d'),
            'estimated_delivery': ro.est_delivery_date.strftime('%Y-%m-%d') if ro.est_delivery_date else '',
            'weight': str(model.weight),
            'delivered': ro.delivered
        })

    return JsonResponse({'data': data})

@login_required
@require_POST
def update_repeated_order_status(request):
    """
    Update the status of a repeated order via AJAX
    """
    try:
        data = json.loads(request.body)
        order_id = data.get('order_id')
        status_id = data.get('status_id')
        quantity_delivered = data.get('quantity_delivered')
        est_delivery_date = data.get('est_delivery_date')
        delivered = data.get('delivered', False)
        
        if not order_id or not status_id:
            return JsonResponse(
                {'status': 'error', 'message': 'Order ID and Status ID are required'}, 
                status=400
            )
            
    except (ValueError, KeyError, json.JSONDecodeError):
        return JsonResponse({'status': 'error', 'message': 'Invalid data'}, status=400)

    # Get the repeated order
    repeated_order = get_object_or_404(RepeatedOrder, id=order_id)
    status = get_object_or_404(ModelStatus, id=status_id)
    
    # Update the order
    repeated_order.status = status
    
    if quantity_delivered is not None and quantity_delivered != '':
        repeated_order.quantity_delivered = int(quantity_delivered)
    
    if est_delivery_date:
        try:
            # Parse date string into date object (format may vary)
            repeated_order.est_delivery_date = datetime.strptime(est_delivery_date, '%Y-%m-%d').date()
        except ValueError:
            return JsonResponse(
                {'status': 'error', 'message': 'Invalid date format'}, 
                status=400
            )
    
    repeated_order.delivered = delivered
    repeated_order.save()

    return JsonResponse({
        'status': 'success', 
        'message': 'Order status updated successfully'
    })

def get_repeated_order_details(request, order_id):
    """
    Get details of a specific repeated order
    """
    order = get_object_or_404(RepeatedOrder, id=order_id)
    
    data = {
        'id': order.id,
        'status_id': order.status.id if order.status else None,
        'status_name': order.status.status if order.status else 'N/A',
        'quantity': order.quantity,
        'quantity_delivered': order.quantity_delivered,
        'est_delivery_date': order.est_delivery_date.strftime('%Y-%m-%d') if order.est_delivery_date else None,
        'delivered': order.delivered,
        'client_name': order.client.get_full_name() or order.client.username if order.client else 'N/A',
        'model_no': order.original_order.model.model_no if hasattr(order.original_order, 'model') else 'N/A',
        'color_name': order.color.color if order.color else 'N/A'
    }
    
    return JsonResponse(data)

def get_model_statuses(request):
    """
    Get all model statuses for dropdown
    """
    statuses = ModelStatus.objects.all()
    data = [{'id': status.id, 'name': status.status} for status in statuses]
    
    return JsonResponse({'data': data})

def get_repeated_orders_api(request):
    """
    API endpoint for DataTables to get repeated orders
    """
    repeated_orders = RepeatedOrder.objects.all().select_related(
        'client', 'status', 'color', 'original_order__model'
    )
    
    data = []
    for order in repeated_orders:
        model = getattr(order.original_order, 'model', None)
        
        order_data = {
            'id': order.id,
            'client_name': order.client.get_full_name() or order.client.username if order.client else 'N/A',
            'model_no': model.model_no if model else 'N/A',
            'status_name': order.status.status if order.status else 'N/A',  # Use status.status not status.name
            'status_id': order.status.id if order.status else None,
            'quantity': order.quantity,
            'quantity_delivered': order.quantity_delivered,
            'color_name': order.color.color if order.color else 'N/A',
            'weight': model.weight if model else None,
            'est_delivery_date': order.est_delivery_date.strftime('%Y-%m-%d') if order.est_delivery_date else None,
            'delivered': order.delivered
        }
        data.append(order_data)
    
    return JsonResponse({'data': data})

@login_required
@require_POST
def add_to_cart_ajax(request):
    """
    Add an item to a client's cart via AJAX request.
    
    The request.user (admin/staff) can add items to any client's cart.
    The client_id is passed in the JSON data to identify which client's cart to update.
    """
    try:
        data = json.loads(request.body)
        model_id = data.get('model_id')
        color_id = data.get('color_id')
        quantity = int(data.get('quantity', 1))
        client_id = data.get('client_id')  # Get client_id from the request data
        
        if not client_id:
            return JsonResponse({'status': 'error', 'message': 'Client ID is required'}, status=400)
            
    except (ValueError, KeyError, json.JSONDecodeError):
        return JsonResponse({'status': 'error', 'message': 'Invalid data'}, status=400)

    # Get the client user
    client = get_object_or_404(User, id=client_id)
    
    # Check if the requesting user has permission to add to this client's cart
    # (This is optional - depends on your permission model)
    # if not request.user.has_perm('edit_cart', client):
    #     return JsonResponse({'status': 'error', 'message': 'Permission denied'}, status=403)
    
    # Get the model and color
    model_obj = get_object_or_404(Model, id=model_id)
    color_obj = None
    if color_id:
        color_obj = get_object_or_404(ModelColor, id=color_id)

    # Check if item already in cart for this client/model/color and update quantity or create new
    cart_item, created = ClientAddToCart.objects.get_or_create(
        client=client,
        model=model_obj,
        color=color_obj,
        defaults={'quantity': quantity}
    )

    if not created:
        cart_item.quantity += quantity
        cart_item.save()

    # Get updated cart counts
    item_count = ClientAddToCart.objects.filter(client=client).count()
    total_quantity = ClientAddToCart.objects.filter(client=client).aggregate(
        total=Sum('quantity'))['total'] or 0

    return JsonResponse({
        'status': 'success', 
        'message': 'Added to cart',
        'count': item_count,
        'total_quantity': total_quantity
    })

@login_required
@require_GET
def cart_item_count(request, client_id):
    """
    Fetches information about a client's cart including:
    - Count of unique items (different model/color combinations)
    - Total quantity of all pieces
    
    Args:
        request: The HTTP request
        client_id: The ID of the client whose cart to check
        
    Returns:
        JsonResponse with cart counts and totals
    """
    # Ensure request is AJAX
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        User = get_user_model()
        # Get the client or return 404
        client = get_object_or_404(User, id=client_id)
        
        # Check if the requesting user has permission to view this client's cart
        # (This is optional - depends on your permission model)
        # if not request.user.has_perm('view_cart', client):
        #     return JsonResponse({'status': 'error', 'message': 'Permission denied'}, status=403)
        
        # Get count of unique items
        item_count = ClientAddToCart.objects.filter(client=client).count()
        
        # Get total quantity of all items
        total_quantity = ClientAddToCart.objects.filter(client=client).aggregate(
            total=Sum('quantity'))['total'] or 0
        
        # Return both counts as JSON
        return JsonResponse({
            'status': 'success', 
            'count': item_count,
            'total_quantity': total_quantity
        })
    
    # Return error for non-AJAX requests
    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)


@csrf_exempt
def get_cart_items(request, client_id):
    """Get all items in the client's cart"""
    cart_items = ClientAddToCart.objects.filter(client_id=client_id).select_related('model', 'color', 'model__jewelry_type')

    items = []
    for item in cart_items:
        # Image
        image_url = static(str(item.model.model_img)) if getattr(item.model, 'model_img', None) else static('img/default_image.png')

        # Order ID logic
        order_id = None
        if hasattr(item.model, 'orders'):
            order = item.model.orders.first()
            if order:
                order_id = order.id
        if not order_id and item.color and hasattr(item.color, 'orders'):
            order = item.color.orders.first()
            if order:
                order_id = order.id

        # Append clean dict
        items.append({
            'id': item.id,
            'model_id': item.model.id,
            'model_no': item.model.model_no,
            'jewelry_type_name': item.model.jewelry_type.name if item.model.jewelry_type else '',
            'weight': item.model.weight,
            'quantity': item.quantity,
            'color': item.color.color if item.color else '',
            'image': image_url,
            'order_id': order_id
        })

    return JsonResponse({'status': 'success', 'items': items})

@csrf_exempt
def update_cart_quantity(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            item_id = data.get('item_id')
            action = data.get('action')

            cart_item = ClientAddToCart.objects.get(id=item_id)

            if action == 'increase':
                cart_item.quantity += 1
            elif action == 'decrease':
                if cart_item.quantity > 1:
                    cart_item.quantity -= 1
                else:
                    return JsonResponse({'success': False, 'message': 'Minimum quantity is 1.'})
            else:
                return JsonResponse({'success': False, 'message': 'Invalid action.'})

            cart_item.save()
            return JsonResponse({'success': True, 'quantity': cart_item.quantity})

        except ClientAddToCart.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Item not found.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

    return JsonResponse({'success': False, 'message': 'Invalid request method.'})


@csrf_exempt
def delete_cart_item(request, item_id):
    ClientAddToCart.objects.filter(id=item_id).delete()
    return JsonResponse({"success": True})


@csrf_exempt
def proceed_to_order(request):
    import json
    data = json.loads(request.body)
    client_id = data.get('client_id')
    cart_items = ClientAddToCart.objects.filter(client_id=client_id)
    
    for item in cart_items:
        Order.objects.create(
            client=item.client,
            model=item.model,
            color=item.color,
            quantity=item.quantity,
            date_of_order=date.today(),
            est_delivery_date=date.today() + timedelta(days=7),
        )
    cart_items.delete()
    return JsonResponse({"success": True})

