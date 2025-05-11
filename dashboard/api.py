from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from product_inv.models import ModelClient, Model
from django.templatetags.static import static
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