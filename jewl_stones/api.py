from django.http import JsonResponse
from .models import Stone, StoneType, StoneTypeDetail
from product_inv.models import *
from django.db.models import Count
import json
from django.views.decorators.csrf import csrf_exempt


def get_complete_stone_data(request):
    stones = Stone.objects.all().prefetch_related('types__details')
    data = []
    
    for stone in stones:
        # Count the total types for this stone
        type_count = stone.types.count()
        
        # Add a single entry per stone
        data.append({
            'id': stone.id,  # Include the stone ID for edit/delete operations
            'stone_name': stone.name,
            'type_count': type_count,
            'status': stone.is_active  
        })
            
    return JsonResponse({'data': data})

@csrf_exempt
def create_stone(request):
    try:
        stone_name = request.POST.get('stone_name')
        is_active = request.POST.get('is_active')
        
        if not stone_name:
            return JsonResponse({'status': 'error', 'message': 'Stone name is required'})
        
        stone = Stone.objects.create(
            name=stone_name,
            is_active=is_active
        )
        
        return JsonResponse({'status': 'success', 'message': 'Stone created successfully'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

from django.db.models import Sum
from django.http import JsonResponse

def get_model_distribution(model_no):
    try:
        model = Model.objects.get(model_no=model_no)
        
        # STONE SECTION
        # Get all stones used in this model via RawStones
        raw_stones = RawStones.objects.filter(model=model)
        
        # Get unique stones (Marquise, Pan, etc.) from raw_stones
        stone_ids = set(raw_stone.stone_type.stone.id for raw_stone in raw_stones)
        stones = Stone.objects.filter(id__in=stone_ids)
        
        # Calculate total weight for the model stones
        all_details = StoneTypeDetail.objects.filter(
            stone_type__in=[rs.stone_type for rs in raw_stones],
            stone__in=stones
        )
        model_total_stone_weight = sum(detail.weight for detail in all_details) or 1  # avoid division by zero
        
        stone_result = []
        
        # Process each stone (Marquise, Pan, etc.)
        for stone in stones:
            stone_types = StoneType.objects.filter(stone=stone, raw_stones__model=model).distinct()
            
            # Calculate total weight for this stone
            stone_details = StoneTypeDetail.objects.filter(
                stone=stone,
                stone_type__in=stone_types
            )
            stone_total_weight = sum(detail.weight for detail in stone_details) or 0
            
            # Calculate percentage of this stone in the model
            stone_percentage = (stone_total_weight / model_total_stone_weight * 100)
            
            stone_data = {
                'stone_id': stone.id,
                'stone_name': stone.name,
                'percentage_in_model': round(stone_percentage, 2),
                'stone_distribution': []
            }
            
            # Process each stone type (White, Hydro, etc.) for this stone
            for stone_type in stone_types:
                type_details = StoneTypeDetail.objects.filter(
                    stone=stone,
                    stone_type=stone_type
                )
                
                type_total_weight = sum(detail.weight for detail in type_details) or 0
                
                # Calculate percentage of this type within the stone
                type_percentage_in_stone = (type_total_weight / stone_total_weight * 100) if stone_total_weight > 0 else 0
                
                # Calculate percentage of this type in the overall model
                type_percentage_in_model = (type_total_weight / model_total_stone_weight * 100)
                
                type_info = {
                    'type_id': stone_type.id,
                    'type_name': stone_type.type_name,
                    'percentage_in_stone': round(type_percentage_in_stone, 2),
                    'percentage_in_model': round(type_percentage_in_model, 2),
                    'distribution': []
                }
                
                # Add details for this stone type
                for detail in type_details:
                    detail_percentage = (detail.weight / type_total_weight * 100) if type_total_weight > 0 else 0
                    
                    type_info['distribution'].append({
                        'detail_id': detail.id,
                        'shape': detail.shape,
                        'length': detail.length,  # Changed from size to length
                        'breadth': detail.breadth,  # Added breadth
                        'weight': str(detail.weight),
                        'rate': str(detail.rate),
                        'percentage': round(detail_percentage, 2)
                    })
                
                stone_data['stone_distribution'].append(type_info)
            
            stone_result.append(stone_data)
            
        # RAW MATERIAL SECTION
        # Get all raw materials used in this model
        raw_materials = RawMaterial.objects.filter(model=model)
        
        # Calculate total weight of all raw materials
        model_total_material_weight = raw_materials.aggregate(total=Sum('weight'))['total'] or 1  # avoid division by zero
        
        material_result = []
        
        # Process each metal
        metal_ids = set(rm.metal.id for rm in raw_materials)
        for metal_id in metal_ids:
            metal = Metal.objects.get(id=metal_id)
            metal_materials = raw_materials.filter(metal=metal)
            
            # Calculate total weight for this metal
            metal_total_weight = metal_materials.aggregate(total=Sum('weight'))['total'] or 0
            
            # Calculate percentage of this metal in the model
            metal_percentage = (metal_total_weight / model_total_material_weight * 100)
            
            material_data = {
                'metal_id': metal.id,
                'metal_unique_id': metal.metal_unique_id,
                'metal_name': metal.name,
                'total_weight': str(metal_total_weight),
                'percentage_in_model': round(metal_percentage, 2)
            }
            
            # Get the latest rate for this metal if exists
            latest_rate = MetalRate.objects.filter(metal=metal).order_by('-date').first()
            if latest_rate:
                material_data.update({
                    'latest_rate': str(latest_rate.rate),
                    'rate_currency': latest_rate.currency,
                    'rate_unit': latest_rate.unit,
                    'rate_weight': str(latest_rate.weight),
                    'rate_date': latest_rate.date.strftime('%Y-%m-%d')
                })
            
            material_result.append(material_data)
        
        return {
            'stone_data': stone_result,
            'material_data': material_result
        }
    
    except Model.DoesNotExist:
        return {'error': 'Model not found'}

def stone_distribution_view(request, model_no):
    stone_data = get_model_distribution(model_no)
    return JsonResponse({'stone_and_material_distribution': stone_data})


def get_stone_type_data(request):
    stone_name = request.GET.get('stone_name', '')

    try:
        stone = Stone.objects.get(name=stone_name)
    except Stone.DoesNotExist:
        return JsonResponse({'data': []})  # Return empty data if stone not found

    stone_types = StoneType.objects.filter(stone=stone).annotate(detail_count=Count('details'))
    data = []

    for stone_type in stone_types:
        # Add the stone type with detail count
        data.append({
            'type_name': stone_type.type_name,
            'detail_count': stone_type.detail_count,
        })

    return JsonResponse({'data': data})
@csrf_exempt
def create_stone_type(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            stone_name = data.get("stone_name")
            type_name = data.get("type_name")
            

            # Fetch or create the Stone instance
            stone, _ = Stone.objects.get_or_create(name=stone_name)

            # Create the StoneType instance
            stone_type, created = StoneType.objects.get_or_create(stone=stone, type_name=type_name)

            return JsonResponse({"message": "Stone Type created successfully"}, status=201)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)

@csrf_exempt
def update_stone(request):
    try:
        stone_id = request.POST.get('stone_id')
        stone_name = request.POST.get('stone_name')
        is_active = request.POST.get('is_active')
        
        if not stone_id or not stone_name:
            return JsonResponse({'status': 'error', 'message': 'Stone ID and name are required'})
        
        stone = Stone.objects.get(id=stone_id)
        stone.name = stone_name
        stone.is_active = is_active
        stone.save()
        
        return JsonResponse({'status': 'success', 'message': 'Stone updated successfully'})
    except Stone.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Stone not found'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

@csrf_exempt
def delete_stone(request):
    try:
        stone_id = request.POST.get('stone_id')
        
        if not stone_id:
            return JsonResponse({'status': 'error', 'message': 'Stone ID is required'})
        
        stone = Stone.objects.get(id=stone_id)
        
        # Check if there are any associated types
        type_count = stone.types.count()
        if type_count > 0:
            return JsonResponse({
                'status': 'error', 
                'message': f'Cannot delete. This stone has {type_count} associated type(s)'
            })
        
        stone.delete()
        
        return JsonResponse({'status': 'success', 'message': 'Stone deleted successfully'})
    except Stone.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Stone not found'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

def get_stone_type_detail_data(request):
    stone_name = request.GET.get('stone_name', '')
    type_name = request.GET.get('type_name', '')

    try:
        stone = Stone.objects.get(name=stone_name)
        stone_type = StoneType.objects.get(stone=stone, type_name=type_name)
    except (Stone.DoesNotExist, StoneType.DoesNotExist):
        return JsonResponse({'data': []})  # Return empty data if stone or type not found

    details = StoneTypeDetail.objects.filter(stone_type=stone_type)
    data = []

    for detail in details:
        data.append({
            'length': detail.length,
            'breadth': detail.breadth,
            'weight': str(detail.weight),
            'rate': str(detail.rate),
        })

    return JsonResponse({'data': data})

@csrf_exempt
def create_stone_type_detail(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            stone_name = data.get("stone_name")
            type_name = data.get("type_name")
            length = data.get("length")
            breadth = data.get("breadth")
            weight = data.get("weight")
            rate = data.get("rate")

            # Get Stone and StoneType
            stone = Stone.objects.get(name=stone_name)
            stone_type = StoneType.objects.get(stone=stone, type_name=type_name)

            # Create the detail
            detail = StoneTypeDetail.objects.create(
                stone=stone,
                stone_type=stone_type,
                length=length,
                breadth=breadth,
                weight=weight,
                rate=rate
            )

            return JsonResponse({"message": "Detail created successfully"}, status=201)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)