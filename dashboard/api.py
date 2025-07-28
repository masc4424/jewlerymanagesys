from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
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
    Retrieve paginated models associated with the logged-in client with server-side filtering
    """
    if request.method != 'GET':
        return JsonResponse({
            'status': 'error',
            'message': 'Only GET method is allowed'
        }, status=405)
        
    try:
        # Get query parameters
        page = request.GET.get('page', 1)
        page_size = int(request.GET.get('page_size', 8))
        category_filter = request.GET.get('category', '')
        search_term = request.GET.get('search', '').strip()
        tab_type = request.GET.get('tab', 'delivered')  # 'delivered' or 'others'
        
        # Limit page size to prevent abuse
        page_size = min(page_size, 50)
        
        # Get all ModelClient entries where client is the logged-in user
        model_clients = ModelClient.objects.filter(client=request.user)
        model_ids = model_clients.values_list('model_id', flat=True)
        
        # Start with base queryset
        models_query = Model.objects.filter(id__in=model_ids).select_related(
            'jewelry_type', 'status'
        ).prefetch_related(
            'model_colors', 'raw_materials__metal', 'raw_stones__stone_type',
            'stone_counts__stone_type_details__stone_type'
        )
        
        # Apply category filter
        if category_filter:
            models_query = models_query.filter(
                jewelry_type__name__icontains=category_filter
            )
        
        # Apply search filter
        if search_term:
            from django.db.models import Q
            models_query = models_query.filter(
                Q(model_no__icontains=search_term) |
                Q(jewelry_type__name__icontains=search_term) |
                Q(status__status__icontains=search_term) |
                Q(weight__icontains=search_term)
            )
        
        # Get all models first to check order status
        all_models = list(models_query)
        
        # Filter based on tab type and order status
        filtered_models = []
        for model in all_models:
            try:
                order = Order.objects.filter(
                    client=request.user,
                    model=model,
                    color__in=model.model_colors.all()
                ).first()
                
                has_delivered_order = order and order.delivered
                
                if tab_type == 'delivered' and has_delivered_order:
                    filtered_models.append((model, order))
                elif tab_type == 'others' and not has_delivered_order:
                    filtered_models.append((model, order))
                    
            except Exception as e:
                # If there's an error checking order status, include in 'others'
                if tab_type == 'others':
                    filtered_models.append((model, None))
        
        # Paginate the filtered results
        paginator = Paginator(filtered_models, page_size)
        
        try:
            paginated_models = paginator.page(page)
        except PageNotAnInteger:
            paginated_models = paginator.page(1)
        except EmptyPage:
            paginated_models = paginator.page(paginator.num_pages)
        
        # Serialize the paginated model data
        models_data = []
        for model, order in paginated_models:
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
                    'weight': float(material.weight) if material.weight is not None else 0.0,
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
                    'stone_size': getattr(stone_count.stone_type_details, 'size', None),
                    'stone_quality': getattr(stone_count.stone_type_details, 'quality', None)
                })
            
            # Order data
            order_data = None
            if order:
                order_data = {
                    'order_id': order.id,
                    'is_delivered': order.delivered
                }
            
            # Create model data dictionary
            model_data = {
                'id': model.id,
                'model_no': model.model_no,
                'length': float(model.length) if model.length is not None else 0.0,
                'breadth': float(model.breadth) if model.breadth is not None else 0.0,
                'weight': float(model.weight) if model.weight is not None else 0.0,
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
        
        # Return paginated response
        return JsonResponse({
            'status': 'success',
            'message': 'Client models retrieved successfully',
            'data': models_data,
            'pagination': {
                'current_page': paginated_models.number,
                'total_pages': paginator.num_pages,
                'total_items': paginator.count,
                'has_next': paginated_models.has_next(),
                'has_previous': paginated_models.has_previous(),
                'page_size': page_size,
                'start_index': paginated_models.start_index(),
                'end_index': paginated_models.end_index()
            }
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
        model = Model.objects.select_related().get(id=model_id)
        
        # Use select_related to optimize the query
        order = Order.objects.select_related('client', 'model').filter(
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
    
# @require_POST
# @login_required
# def create_repeated_order(request):
#     cart_items = ClientAddToCart.objects.filter(client=request.user, order_id__isnull=False)

#     if not cart_items.exists():
#         return JsonResponse({'status': 'error', 'message': 'No cart items found with an order_id'}, status=400)

#     first_item = cart_items.first()
#     try:
#         original_order = Order.objects.get(id=first_item.order_id)
#     except Order.DoesNotExist:
#         return JsonResponse({'status': 'error', 'message': 'Original order not found'}, status=404)

#     repeated_orders = []

#     for item in cart_items:
#         repeated = RepeatedOrder.objects.create(
#             original_order=original_order,
#             client=request.user,
#             color=item.color,
#             quantity=item.quantity,
#             est_delivery_date=None
#         )
#         repeated.repeat_order_id = str(repeated.id)
#         repeated.save()

#         # Delete only specific cart item (filtered by client, model, and color)
#         ClientAddToCart.objects.filter(
#             client=request.user,
#             model=item.model,
#             color=item.color
#         ).delete()

#         repeated_orders.append({
#             'repeat_order_id': repeated.repeat_order_id,
#             'model_no': item.model.model_no,
#             'quantity': item.quantity
#         })

#     return JsonResponse({
#         'status': 'success',
#         'message': 'Repeated orders created successfully',
#         'data': repeated_orders
#     })

@require_POST
@login_required
def create_repeated_order(request):
    cart_items = ClientAddToCart.objects.filter(client=request.user, order_id__isnull=False)

    if not cart_items.exists():
        return JsonResponse({'status': 'error', 'message': 'No cart items found with an order_id'}, status=400)

    # Group cart items by order_id
    from collections import defaultdict
    grouped_items = defaultdict(list)
    
    for item in cart_items:
        grouped_items[item.order_id].append(item)

    repeated_orders_by_original = []

    for order_id, items in grouped_items.items():
        try:
            original_order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            continue

        repeated_items = []
        
        for item in items:
            repeated = RepeatedOrder.objects.create(
                original_order=original_order,
                client=request.user,
                color=item.color,
                quantity=item.quantity,
                est_delivery_date=None
            )
            repeated.repeat_order_id = str(repeated.id)
            repeated.save()

            # Delete the specific cart item
            ClientAddToCart.objects.filter(id=item.id).delete()

            repeated_items.append({
                'repeat_order_id': repeated.repeat_order_id,
                'model_no': item.model.model_no,
                'quantity': item.quantity
            })

        repeated_orders_by_original.append({
            'original_order_id': order_id,
            'repeated_orders': repeated_items
        })

    return JsonResponse({
        'status': 'success',
        'message': 'Repeated orders created successfully',
        'data': repeated_orders_by_original,
        'total_original_orders': len(repeated_orders_by_original)
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