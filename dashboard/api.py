from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from product_inv.models import ModelClient, Model
from django.templatetags.static import static
from django.views.decorators.http import require_POST
from order.models import ClientAddToCart
import json
from django.conf import settings
import traceback

@login_required(login_url='login')
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
            colors = list(model.model_colors.values_list('color', flat=True))
            
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
                'stone_counts': stone_counts
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
    

@login_required
@require_POST
def add_to_cart(request):
    """Add a model to the client's cart"""
    model_id = request.POST.get('model_id')
    quantity = int(request.POST.get('quantity', 1))
    
    if not model_id:
        return JsonResponse({'status': 'error', 'message': 'Model ID is required'}, status=400)
        
    try:
        model = Model.objects.get(id=model_id)
        
        # Always create a new cart item
        cart_item = ClientAddToCart.objects.create(
            client=request.user,
            model=model,
            quantity=quantity
        )
        
        message = f"Added {model.model_no} to your cart"
        return JsonResponse({'status': 'success', 'message': message})
        
    except Model.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Model not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
def get_cart_count(request):
    """Get the count of items in the client's cart"""
    count = ClientAddToCart.objects.filter(client=request.user).count()
    return JsonResponse({'status': 'success', 'count': count})


@login_required
def get_cart_items(request):
    """Get all items in the client's cart"""
    cart_items = ClientAddToCart.objects.filter(client=request.user).select_related('model')
    
    items = []
    for item in cart_items:
        items.append({
            'id': item.id,
            'model_id': item.model.id,
            'model_no': item.model.model_no,
            'jewelry_type_name': item.model.jewelry_type.name if hasattr(item.model, 'jewelry_type') else '',
            'weight': item.model.weight,
            'quantity': item.quantity,
            'image': item.model.model_img.url if hasattr(item.model, 'model_img') and item.model.model_img else '',
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
