from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.templatetags.static import static
from django.http import JsonResponse
from order.models import Order, RepeatedOrder
from product_inv.models import *
import json
from datetime import date, timedelta, datetime

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

    # GET logic (original code)
    orders = Order.objects.all().select_related('client', 'model', 'color', 'status')
    data = []

    for i, order in enumerate(orders, start=1):
        repeated_orders = order.repeated_orders.all()
        total_repeats = repeated_orders.count()
        delivered_repeats = repeated_orders.filter(delivered=True).count()
        in_progress = total_repeats - delivered_repeats

        model_no = order.model.model_no if order.model else "N/A"
        weight = order.model.weight if order.model else "N/A"

        model_image = ""
        if order.model and order.model.model_img:
            model_image = static(f"model_img/{order.model.model_img.name.split('/')[-1]}")

        status_text = order.status.status if order.status else "N/A"
        status_id = order.status.id if order.status else None

        data.append({
            'sl_no': i,
            'model_no': model_no,
            'model_image': model_image,
            'client': order.client.username if order.client else "No Client",
            'status': status_text,
            'status_id': status_id,
            'quantity': order.quantity,
            'delivered': 'Yes' if order.delivered else 'No',
            'repeated_order': total_repeats,
            'in_progress': in_progress,
            'weight': weight,
            'color': order.color.color if order.color else "N/A",
            'delivery_date': order.est_delivery_date.strftime("%Y-%m-%d"),
            'order_id': order.id,
        })

    return JsonResponse({'data': data})

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

@csrf_exempt
def create_repeat_order(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        order_id = data.get('order_id')
        quantity = data.get('quantity')
        est_delivery_date = data.get('est_delivery_date')
        
        try:
            # Get the original order
            original_order = Order.objects.get(id=order_id)
            
            # Create a new repeated order
            repeat_order = RepeatedOrder.objects.create(
                original_order=original_order,
                quantity=quantity,
                est_delivery_date=datetime.strptime(est_delivery_date, '%Y-%m-%d').date(),
                delivered=False
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Repeat order created successfully',
                'repeat_order_id': repeat_order.id
            })
            
        except Order.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Original order not found'
            }, status=404)
        
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
        
@csrf_exempt
def update_order(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        order_id = data.get('order_id')
        est_delivery_date = data.get('est_delivery_date')
        quantity = data.get('quantity')
        
        try:
            order = Order.objects.get(id=order_id)
            
            # Update order information
            if est_delivery_date:
                order.est_delivery_date = datetime.strptime(est_delivery_date, '%Y-%m-%d').date()
            
            if quantity:
                order.quantity = quantity
            
            order.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Order updated successfully'
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
        data.append({
            'model_no': model.model_no,
            'model_img': static(f"model_img/{model.model_img.name.split('/')[-1]}"),
            'status': model.status.status if model.status else '',
            'jewelry_type': model.jewelry_type.name,
            'quantity': ro.quantity,
            'color': ro.color.color if ro.color else '',
            'order_date': ro.date_of_reorder.strftime('%Y-%m-%d'),
            'estimated_delivery': ro.est_delivery_date.strftime('%Y-%m-%d') if ro.est_delivery_date else '',
            'weight': str(model.weight)
        })

    return JsonResponse({'data': data})