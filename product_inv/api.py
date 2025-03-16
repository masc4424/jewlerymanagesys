from django.http import JsonResponse
from jewl_stones.models import Stone, StoneType, StoneTypeDetail
from product_inv.models import *
from django.db.models import Sum
from django.http import JsonResponse
from decimal import Decimal
from django.db.models import Count
from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
import os
from django.conf import settings

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
            stone_total_rate = sum(Decimal(detail.rate) for detail in stone_details)

            stone_total_weight = sum(detail.weight for detail in stone_details) or 0
            
            # Calculate percentage of this stone in the model
            stone_percentage = (stone_total_weight / model_total_stone_weight * 100)


            
            stone_data = {
                'stone_id': stone.id,
                'stone_name': stone.name,
                'total_weight': round(stone_total_weight, 2),  # Add total weight
                'total_rate': round(stone_total_rate, 2),  # Add total rate
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

                type_stone_total_rate = sum(detail.rate for detail in type_details) or Decimal(0)

                type_stone_total_weight = sum(detail.weight for detail in type_details) or 0
                
                type_info = {
                    'type_id': stone_type.id,
                    'type_name': stone_type.type_name,
                    'percentage_in_stone': round(type_percentage_in_stone, 2),
                    'percentage_in_model': round(type_percentage_in_model, 2),
                    'type_stone_total_rate':type_stone_total_rate,
                    'type_stone_total_weight':type_stone_total_weight,
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
                
                if type_info['distribution']:
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

def get_jewelry_types_with_model_count(request):
    jewelry_data = JewelryType.objects.annotate(model_count=Count('models')).values('id', 'name', 'unique_id', 'model_count')
    return JsonResponse({'data': list(jewelry_data)})

def get_models_by_jewelry_type(request, jewelry_type_name=None):
    if jewelry_type_name:
        try:
            # Try getting by name first
            jewelry_type = JewelryType.objects.get(name=jewelry_type_name)
        except JewelryType.DoesNotExist:
            # Fallback to ID if it's actually a numeric ID
            try:
                jewelry_id = int(jewelry_type_name)
                jewelry_type = JewelryType.objects.get(id=jewelry_id)
            except (ValueError, JewelryType.DoesNotExist):
                return JsonResponse({'error': 'Jewelry type not found'}, status=404)
                
        models = Model.objects.filter(jewelry_type=jewelry_type).values('id', 'model_no', 'length', 'breadth', 'weight','model_img').annotate(no_of_pieces=Count('model_no')) 
        return JsonResponse({'data': list(models)}, safe=False)

@csrf_exempt
def create_model(request):
    if request.method == 'POST':
        try:
            # Get form data
            model_no = request.POST.get('model_no')
            length = request.POST.get('length')
            breadth = request.POST.get('breadth')
            weight = request.POST.get('weight')
            jewelry_type_id = request.POST.get('jewelry_type')
            model_img = request.FILES.get('model_img')

            # Validate required fields
            if not all([model_no, length, breadth, weight, jewelry_type_id, model_img]):
                return JsonResponse({'error': 'All fields are required'}, status=400)

            # Check if model number already exists
            if Model.objects.filter(model_no=model_no).exists():
                return JsonResponse({'error': 'Model number already exists'}, status=400)

            # Get the jewelry type
            jewelry_type = get_object_or_404(JewelryType, id=jewelry_type_id)

            # Define the target directory
            target_directory = os.path.join(settings.BASE_DIR, 'product_inv/static/model_img/')

            # Ensure the directory exists
            os.makedirs(target_directory, exist_ok=True)

            # Extract file extension and rename the file
            file_extension = os.path.splitext(model_img.name)[1]
            new_filename = f"{model_no}{file_extension}"
            file_path = os.path.join(target_directory, new_filename)

            # Save the file manually
            with open(file_path, 'wb+') as destination:
                for chunk in model_img.chunks():
                    destination.write(chunk)

            # Save relative path in the database
            relative_path = f"model_image/{new_filename}"

            # Create new model
            model = Model.objects.create(
                model_no=model_no,
                length=length,
                breadth=breadth,
                weight=weight,
                model_img=relative_path,  # Save relative path instead of full path
                jewelry_type=jewelry_type
            )

            return JsonResponse({
                'success': True, 
                'message': 'Model created successfully',
                'model': {
                    'id': model.id,
                    'model_no': model.model_no,
                    'length': float(model.length),
                    'breadth': float(model.breadth),
                    'weight': float(model.weight),
                    'image_path': relative_path
                }
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)


def get_model(request, model_id):
    model = get_object_or_404(Model, id=model_id)
    return JsonResponse({
        'id': model.id,
        'model_no': model.model_no,
        'length': float(model.length),
        'breadth': float(model.breadth),
        'weight': float(model.weight),
    })

import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

@csrf_exempt
def edit_model(request):
    if request.method == 'POST':
        try:
            logging.info("Received POST request to edit model.")

            model_id = request.POST.get('model_id')
            model_no = request.POST.get('model_no')
            length = request.POST.get('length')
            breadth = request.POST.get('breadth')
            weight = request.POST.get('weight')
            model_img = request.FILES.get('model_img')

            logging.info(f"Received data: model_id={model_id}, model_no={model_no}, length={length}, breadth={breadth}, weight={weight}")

            if not all([model_id, model_no, length, breadth, weight]):
                logging.warning("Validation failed: Missing required fields.")
                return JsonResponse({'error': 'All fields are required'}, status=400)

            model = get_object_or_404(Model, id=model_id)
            logging.info(f"Fetched model from database: {model}")

            # Check if model number is being changed and already exists
            if model.model_no != model_no and Model.objects.filter(model_no=model_no).exists():
                logging.warning(f"Model number conflict: {model_no} already exists.")
                return JsonResponse({'error': 'Model number already exists'}, status=400)

            # Updating model fields
            model.model_no = model_no
            model.length = length
            model.breadth = breadth
            model.weight = weight

            # Handling image update
            if model_img:
                target_directory = os.path.join(settings.BASE_DIR, 'product_inv/static/model_img/')
                os.makedirs(target_directory, exist_ok=True)  # Ensure the directory exists

                file_extension = os.path.splitext(model_img.name)[1]
                new_img_name = f"{model_no}{file_extension}"
                file_path = os.path.join(target_directory, new_img_name)

                logging.info(f"New image received. Renaming to: {new_img_name}")

                # Check if the model already had an image and remove the old image
                if model.model_img:
                    old_image_path = os.path.join(target_directory, os.path.basename(model.model_img.name))
                    logging.info(f"Old image path: {old_image_path}")

                    if os.path.exists(old_image_path):
                        os.remove(old_image_path)
                        logging.info("Old image successfully removed.")
                    else:
                        logging.warning("Old image file not found, skipping deletion.")

                # Save new image manually
                with open(file_path, 'wb+') as destination:
                    for chunk in model_img.chunks():
                        destination.write(chunk)

                # Save relative path in the database
                model.model_img = f"model_img/{new_img_name}"
                logging.info("New image assigned to model.")

            # Save model
            model.save()
            logging.info("Model updated successfully.")

            return JsonResponse({
                'success': True, 
                'message': 'Model updated successfully',
                'model': {
                    'id': model.id,
                    'model_no': model.model_no,
                    'length': float(model.length),
                    'breadth': float(model.breadth),
                    'weight': float(model.weight),
                    'image_updated': model_img is not None
                }
            })

        except Exception as e:
            logging.error(f"Error occurred: {str(e)}", exc_info=True)
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def delete_model(request, model_id):
    if request.method == 'DELETE':
        try:
            model = get_object_or_404(Model, id=model_id)

            # Delete associated image
            if model.model_img:  # Ensure model has an image
                image_path = os.path.join(settings.BASE_DIR, 'product_inv/static/', str(model.model_img))
                if os.path.exists(image_path):
                    os.remove(image_path)

            # Delete model entry from database
            model.delete()

            return JsonResponse({'success': True, 'message': 'Model deleted successfully'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=400)
