from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from product_inv.models import *
from django.templatetags.static import static
from django.views.decorators.http import require_POST
from django.views.decorators.http import require_http_methods
from order.models import ClientAddToCart, Order, RepeatedOrder
import json
from django.db.models import Sum
from django.conf import settings
import traceback
from order.models import Order

@login_required(login_url='login_auth')
def get_client_models(request):
    """
    Retrieve all models associated with the logged-in client without using DRF
    """
    if request.method != 'GET':
        return JsonResponse({
            'status': 'error',
            'message': 'Only GET method is allowed'
        }, status=405)
        
    try:
        # Get all ModelClient entries where client is the logged-in user
        model_clients = ModelClient.objects.filter(client=request.user)
        
        # Extract the model IDs from the ModelClient relations
        model_ids = model_clients.values_list('model_id', flat=True)
        
        # Get the actual model objects
        models = Model.objects.filter(id__in=model_ids)
        
        # Manually serialize the model data
        models_data = []
        for model in models:
            # Get base URL for media
            if settings.MEDIA_URL.startswith('http'):
                media_base_url = settings.MEDIA_URL
            else:
                protocol = 'https' if request.is_secure() else 'http'
                media_base_url = f"{protocol}://{request.get_host()}{settings.MEDIA_URL}"
            
            # Create the model image URL
            if model.model_img:
                model_img_url = request.build_absolute_uri(static(f"{model.model_img}"))
            else:
                model_img_url = request.build_absolute_uri(static("default.jpg"))
            
            # Get jewelry type name
            jewelry_type_name = model.jewelry_type.name if model.jewelry_type else "N/A"
            
            # Get status name
            status_name = model.status.status if model.status else "N/A"
            
            # Get model colors
            colors = list(model.model_colors.values('id', 'color'))
            
            # Get raw materials
            materials = []
            for material in model.raw_materials.all():
                materials.append({
                    'metal_name': material.metal.name,
                    'metal_id': material.metal.metal_unique_id,
                    'weight': float(material.weight),
                    'unit': material.unit
                })
            
            # Get raw stones
            stones = []
            for stone in model.raw_stones.all():
                stones.append({
                    'stone_name': stone.stone_type.type_name
                })
            
            # Get stone counts
            stone_counts = []
            for stone_count in model.stone_counts.all():
                stone_counts.append({
                    'count': stone_count.count,
                    'stone_name': stone_count.stone_type_details.stone_type.type_name,
                    'stone_size': stone_count.stone_type_details.size,
                    'stone_quality': stone_count.stone_type_details.quality
                })

            try:
                # Filter orders by model AND its colors
                order = Order.objects.filter(
                    client=request.user,
                    model=model,
                    color__in=model.model_colors.all()
                ).first()

                if order:
                    order_data = {
                        'order_id': order.id,
                        'is_delivered': order.delivered  # Add delivery status
                    }
                else:
                    order_data = None

            except Order.DoesNotExist:
                order_data = None
            
            # Create model data dictionary
            model_data = {
                'id': model.id,
                'model_no': model.model_no,
                'length': float(model.length),
                'breadth': float(model.breadth),
                'weight': float(model.weight),
                'model_img': model_img_url,
                'jewelry_type_name': jewelry_type_name,
                'status_name': status_name,
                'colors': colors,
                'materials': materials,
                'stones': stones,
                'stone_counts': stone_counts,
                'order': order_data
            }
            
            models_data.append(model_data)
        
        return JsonResponse({
            'status': 'success',
            'message': 'Client models retrieved successfully',
            'data': models_data
        })
        
    except ObjectDoesNotExist as e:
        return JsonResponse({
            'status': 'error',
            'message': f"Object not found: {str(e)}"
        }, status=404)
    except Exception as e:
        # Log the full exception for debugging
        print(f"Error in get_client_models: {str(e)}")
        print(traceback.format_exc())
        
        return JsonResponse({
            'status': 'error',
            'message': f"An error occurred: {str(e)}"
        }, status=500)

@login_required(login_url='login_auth')
def check_order_for_color(request, model_id):
    """
    Check if an order exists for the logged-in client and selected model color
    """
    # Debug logging to see what parameters are coming in
    print(f"check_order_for_color called with model_id: {model_id}, type: {type(model_id)}")
    print(f"GET parameters: {request.GET}")
    
    if request.method != 'GET':
        return JsonResponse({
            'status': 'error',
            'message': 'Only GET method is allowed'
        }, status=405)
    
    # Ensure model_id is an integer
    try:
        model_id = int(model_id)
    except ValueError:
        return JsonResponse({
            'status': 'error',
            'message': f'Invalid model ID: {model_id}'
        }, status=400)
    
    # Get color from query parameters
    color = request.GET.get('color')
    if not color:
        return JsonResponse({
            'status': 'error',
            'message': 'Color parameter is required'
        }, status=400)
    
    try:
        model = Model.objects.get(id=model_id)
        
        # Check if there's an order for the given model and color
        order = Order.objects.filter(
            client=request.user,
            model=model
        ).first()
        
        order_exists = order is not None
        is_delivered = order.delivered if order else False
        
        return JsonResponse({
            'status': 'success',
            'data': {
                'order_exists': order_exists,
                'is_delivered': is_delivered
            }
        })
    
    except Model.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': f'Model with ID {model_id} not found'
        }, status=404)
    
    except Exception as e:
        print(f"Exception in check_order_for_color: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)
    
@login_required
@require_POST
def add_to_cart(request):
    model_id = request.POST.get('model_id')
    quantity = int(request.POST.get('quantity', 1))
    color_id = request.POST.get('color')  # This is the color ID
    order_id = request.POST.get('order_id')  # Get the order ID (primary key of Order)

    if not model_id:
        return JsonResponse({'status': 'error', 'message': 'Model ID is required'}, status=400)

    try:
        model = Model.objects.get(id=model_id)

        # Validate color if provided
        color_obj = None
        if color_id:
            try:
                color_id = int(color_id)
            except ValueError:
                return JsonResponse({'status': 'error', 'message': 'Invalid color ID'}, status=400)

            color_obj = ModelColor.objects.filter(id=color_id, model=model).first()
            if not color_obj:
                valid_ids = list(ModelColor.objects.filter(model=model).values_list('id', flat=True))
                return JsonResponse({
                    'status': 'error',
                    'message': f'Invalid color for this model. Valid IDs: {valid_ids}'
                }, status=400)

        # Validate order if provided
        order_obj = None
        if order_id:
            try:
                order_obj = Order.objects.get(id=order_id)
            except Order.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Invalid order ID'}, status=400)

        # Create cart item
        cart_item = ClientAddToCart.objects.create(
            client=request.user,
            model=model,
            color=color_obj,
            quantity=quantity,
            order=order_obj  # ForeignKey to Order
        )

        message = f"Added {model.model_no} ({color_obj.color if color_obj else 'No Color'}) to your cart"
        return JsonResponse({'status': 'success', 'message': message})

    except Model.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Model not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@login_required
def get_cart_count(request):
    """Get the count of total pieces in the client's cart"""
    # Get count of unique items
    item_count = ClientAddToCart.objects.filter(client=request.user).count()
    
    # Get total quantity of all items
    total_quantity = ClientAddToCart.objects.filter(client=request.user).aggregate(
        total=Sum('quantity'))['total'] or 0
    
    return JsonResponse({
        'status': 'success', 
        'count': item_count,
        'total_quantity': total_quantity
    })


@login_required
def get_cart_items(request):
    """Get all items in the client's cart"""
    cart_items = ClientAddToCart.objects.filter(client=request.user).select_related('model')

    items = []
    for item in cart_items:
        if hasattr(item.model, 'model_img') and item.model.model_img:
            image_url = static(str(item.model.model_img))  # e.g., 'model_img/VSJ-385.png'
        else:
            image_url = static('img/default_image.png')  # fallback image

        # Initialize order_id as None
        order_id = None

        # Try to get the order_id from the model
        if item.model and hasattr(item.model, 'orders'):
            order = item.model.orders.first()  # Get the first order for the model, or None
            if order:
                order_id = order.id

        # If no order found for the model, try getting from the color
        if not order_id and item.color:
            if hasattr(item.color, 'orders'):
                order = item.color.orders.first()  # Get the first order for the color, or None
                if order:
                    order_id = order.id

        items.append({
            'id': item.id,
            'model_id': item.model.id,
            'model_no': item.model.model_no,
            'jewelry_type_name': item.model.jewelry_type.name if hasattr(item.model, 'jewelry_type') else '',
            'weight': item.model.weight,
            'quantity': item.quantity,
            'color': item.color.color if item.color else '',
            'image': image_url,
            'order_id': order_id  # Include the order_id
        })

    return JsonResponse({'status': 'success', 'items': items})


@login_required
@require_POST
def update_cart_item(request):
    """Update the quantity of an item in the cart"""
    cart_item_id = request.POST.get('cart_item_id')
    quantity = int(request.POST.get('quantity', 1))
    
    if not cart_item_id:
        return JsonResponse({'status': 'error', 'message': 'Cart item ID is required'}, status=400)
        
    try:
        cart_item = ClientAddToCart.objects.get(id=cart_item_id, client=request.user)
        cart_item.quantity = quantity
        cart_item.save()
        
        return JsonResponse({'status': 'success', 'message': 'Cart updated successfully'})
        
    except ClientAddToCart.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Cart item not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_POST
def remove_from_cart(request):
    """Remove an item from the cart"""
    cart_item_id = request.POST.get('cart_item_id')
    
    if not cart_item_id:
        return JsonResponse({'status': 'error', 'message': 'Cart item ID is required'}, status=400)
        
    try:
        cart_item = ClientAddToCart.objects.get(id=cart_item_id, client=request.user)
        cart_item.delete()
        
        return JsonResponse({'status': 'success', 'message': 'Item removed from cart'})
        
    except ClientAddToCart.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Cart item not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
@require_POST
@login_required
def create_repeated_order(request):
    cart_items = ClientAddToCart.objects.filter(client=request.user, order_id__isnull=False)

    if not cart_items.exists():
        return JsonResponse({'status': 'error', 'message': 'No cart items found with an order_id'}, status=400)

    first_item = cart_items.first()
    try:
        original_order = Order.objects.get(id=first_item.order_id)
    except Order.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Original order not found'}, status=404)

    repeated_orders = []

    for item in cart_items:
        repeated = RepeatedOrder.objects.create(
            original_order=original_order,
            client=request.user,
            color=item.color,
            quantity=item.quantity,
            est_delivery_date=None
        )
        repeated.repeat_order_id = str(repeated.id)
        repeated.save()

        # Delete only specific cart item (filtered by client, model, and color)
        ClientAddToCart.objects.filter(
            client=request.user,
            model=item.model,
            color=item.color
        ).delete()

        repeated_orders.append({
            'repeat_order_id': repeated.repeat_order_id,
            'model_no': item.model.model_no,
            'quantity': item.quantity
        })

    return JsonResponse({
        'status': 'success',
        'message': 'Repeated orders created successfully',
        'data': repeated_orders
    })

@login_required
@require_http_methods(["GET"])
def get_jewelry_types_simple(request):
    """
    Simple API endpoint to fetch jewelry type names only
    """
    try:
        jewelry_types = JewelryType.objects.all().values('id', 'name').order_by('name')
        
        return JsonResponse({
            'status': 'success',
            'data': list(jewelry_types)
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error fetching jewelry types: {str(e)}',
            'data': []
        }, status=500)