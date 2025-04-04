from django.http import JsonResponse
from jewl_stones.models import Stone, StoneType, StoneTypeDetail
from jewl_metals.models import *
from product_inv.models import *
from django.db.models import Sum
from django.http import JsonResponse
from decimal import Decimal
from django.db.models import Count
from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
import os
from django.conf import settings
import json
from django.utils import timezone
import datetime
from django.db.models.functions import Abs
from django.db.models import F
import uuid

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
                        # 'shape': detail.shape,
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

# @csrf_exempt
# def create_model(request):
#     if request.method == 'POST':
#         try:
#             # Get form data
#             model_no = request.POST.get('model_no')
#             length = request.POST.get('length')
#             breadth = request.POST.get('breadth')
#             weight = request.POST.get('weight')
#             jewelry_type_id = request.POST.get('jewelry_type')
#             jewelry_type = get_object_or_404(JewelryType, id=jewelry_type_id)
#             model_img = request.FILES.get('model_img')
#             selected_colors = request.POST.getlist('colors[]')

#             # Validate required fields
#             if not all([model_no, length, breadth, weight, jewelry_type_id, model_img, selected_colors]):
#                 return JsonResponse({'error': 'All fields are required'}, status=400)

#             # Check if model number already exists
#             if Model.objects.filter(model_no=model_no).exists():
#                 return JsonResponse({'error': 'Model number already exists'}, status=400)

#             # Get the jewelry type
#             jewelry_type = get_object_or_404(JewelryType, id=jewelry_type_id)

#             # Define the target directory
#             target_directory = os.path.join(settings.BASE_DIR, 'product_inv/static/model_img/')

#             # Ensure the directory exists
#             os.makedirs(target_directory, exist_ok=True)

#             # Extract file extension and rename the file
#             file_extension = os.path.splitext(model_img.name)[1]
#             new_filename = f"{model_no}{file_extension}"
#             file_path = os.path.join(target_directory, new_filename)

#             # Save the file manually
#             with open(file_path, 'wb+') as destination:
#                 for chunk in model_img.chunks():
#                     destination.write(chunk)

#             # Save relative path in the database
#             relative_path = f"model_image/{new_filename}"

#             # Create new model
#             model = Model.objects.create(
#                 model_no=model_no,
#                 length=length,
#                 breadth=breadth,
#                 weight=weight,
#                 model_img=relative_path,  # Save relative path instead of full path
#                 jewelry_type=jewelry_type
#             )
#             for color in selected_colors:
#                             ModelColor.objects.create(model=model, color=color)
#             return JsonResponse({
#                 'success': True, 
#                 'message': 'Model created successfully',
#                 'model': {
#                     'id': model.id,
#                     'model_no': model.model_no,
#                     'length': float(model.length),
#                     'breadth': float(model.breadth),
#                     'weight': float(model.weight),
#                     'image_path': relative_path,
#                     'color': selected_colors,
#                     'jewelry_type_name': jewelry_type.name
#                 }
#             })
            
#         except Exception as e:
#             return JsonResponse({'error': str(e)}, status=500)

#     return JsonResponse({'error': 'Invalid request method'}, status=405)

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
            jewelry_type = get_object_or_404(JewelryType, id=jewelry_type_id)
            model_img = request.FILES.get('model_img')
            selected_colors = request.POST.getlist('colors[]')
            # selected_colors = request.POST.getlist('colors')

            
            # Get stones data
            stones_json = request.POST.get('stones', '[]')
            stones_data = json.loads(stones_json)

            # Validate required fields
            if not all([model_no, length, breadth, weight, jewelry_type_id, model_img, selected_colors]):
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
                model_img=relative_path,
                jewelry_type=jewelry_type
            )
            
            # Create model colors
            for color in selected_colors:
                ModelColor.objects.create(model=model, color=color)
            
            # Create RawStones entries
            for stone_data in stones_data:
                stone_type = get_object_or_404(StoneType, id=stone_data['stone_type_id'])
                RawStones.objects.create(
                    model=model,
                    stone_type=stone_type
                )

            raw_materials_json = request.POST.get('raw_materials', '[]')
            raw_materials_data = json.loads(raw_materials_json)
            
            # Create RawMaterial entries
            for material_data in raw_materials_data:
                metal = get_object_or_404(Metal, id=material_data['material_id'])
                RawMaterial.objects.create(
                    model=model,
                    metal=metal,
                    weight=material_data['weight'],
                    unit='g'  # Default to grams
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
                    'image_path': relative_path,
                    'color': selected_colors,
                    'jewelry_type_name': jewelry_type.name
                }
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

# New endpoint to get all stones
def get_stones(request):
    stones = Stone.objects.all()
    stone_list = [{'id': stone.id, 'name': stone.name} for stone in stones]
    return JsonResponse(stone_list, safe=False)

# New endpoint to get stone types for a specific stone
def get_stone_types(request, stone_id):
    stone = get_object_or_404(Stone, id=stone_id)
    types = stone.types.all()  # Using the related_name from the model
    type_list = [{'id': t.id, 'type_name': t.type_name} for t in types]
    return JsonResponse(type_list, safe=False)

# New endpoint to get stone type details
def get_stone_type_details(request, type_id):
    try:
        # Get the first detail for this type as an example
        detail = StoneTypeDetail.objects.filter(stone_type_id=type_id).first()
        if detail:
            return JsonResponse({
                # 'shape': detail.shape,
                'weight': float(detail.weight),
                'length': detail.length,
                'breadth': detail.breadth,
                'rate': float(detail.rate)
            })
        return JsonResponse({}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def get_model(request, model_id):
    model = get_object_or_404(Model, id=model_id)
    model_colors = ModelColor.objects.filter(model=model).values_list('color', flat=True)
    return JsonResponse({
        'id': model.id,
        'model_no': model.model_no,
        'length': float(model.length),
        'breadth': float(model.breadth),
        'weight': float(model.weight),
        'colors': list(model_colors),
    })

@csrf_exempt
def get_materials(request):
    """
    Retrieve all available metals
    """
    if request.method == 'GET':
        metals = Metal.objects.all()
        metal_data = [
            {
                'id': metal.id,
                'name': metal.name,
                'metal_unique_id': metal.metal_unique_id
            } for metal in metals
        ]
        return JsonResponse(metal_data, safe=False)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def get_material_rate(request, metal_id):
    """
    Get current rate for a specific metal based on weight with enhanced error handling
    """
    if request.method == 'GET':
        try:
            # Get the metal
            try:
                metal = Metal.objects.get(id=metal_id)
            except Metal.DoesNotExist:
                return JsonResponse({'error': f'Metal with ID {metal_id} not found'}, status=404)
            
            # Get the weight from query params
            try:
                weight = float(request.GET.get('weight', 0))
            except ValueError:
                return JsonResponse({'error': 'Invalid weight parameter'}, status=400)
            
            # Get today's rate for the metal
            today = datetime.datetime.now().date()
            
            # Debug logging
            print(f"Searching for metal rate:")
            print(f"Metal ID: {metal_id}")
            print(f"Metal Name: {metal.name}")
            print(f"Weight: {weight} grams")
            print(f"Date: {today}")
            
            # Check if any rates exist for this metal and date
            existing_rates = MetalRate.objects.filter(
                metal=metal, 
                date=today
            )
            
            print(f"Total rates found for this metal and date: {existing_rates.count()}")
            if existing_rates.exists():
                print("Existing rates details:")
                for rate in existing_rates:
                    print(f"- Weight: {rate.weight}, Rate: {rate.rate}")
            
            # First try exact match
            metal_rate = existing_rates.filter(
                weight=weight, 
                unit='gram'
            ).first()
            
            # If no exact match, find closest rate
            if not metal_rate:
                metal_rate = existing_rates.order_by(
                    Abs(F('weight') - weight)
                ).first()
            
            if metal_rate:
                return JsonResponse({
                    'rate': float(metal_rate.rate),
                    'date': metal_rate.date,
                    'currency': metal_rate.currency,
                    'matched_weight': metal_rate.weight  # Added to show which weight was matched
                })
            else:
                return JsonResponse({
                    'error': 'No rate found for this material',
                    'details': {
                        'metal_id': metal_id,
                        'metal_name': metal.name,
                        'requested_weight': weight,
                        'date': today
                    }
                }, status=404)
        
        except Exception as e:
            return JsonResponse({
                'error': 'Unexpected error occurred',
                'details': str(e)
            }, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)

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
            colors = request.POST.getlist('colors[]')

            logging.info(f"Received data: model_id={model_id}, model_no={model_no}, length={length}, breadth={breadth}, weight={weight}")
            logging.info(f"Received colors: {colors}") 
            if not all([model_id, model_no, length, breadth, weight, colors]):
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
            model.colors = ','.join(colors)

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

            # MOVED OUTSIDE OF IF BLOCK - Process colors regardless of image upload
            existing_colors = list(ModelColor.objects.filter(model=model).values_list('color', flat=True))
            logging.info(f"Existing colors before update: {existing_colors}")
            # Clear existing colors
            ModelColor.objects.filter(model=model).delete()
            logging.info("Deleted existing model colors")

            # Add new colors
            for color in colors:
                ModelColor.objects.create(model=model, color=color)
                logging.info(f"Created new color: {color}")

            # Save model
            model.save()
            final_colors = list(ModelColor.objects.filter(model=model).values_list('color', flat=True))
            logging.info(f"Final colors after update: {final_colors}")
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
                    'image_updated': model_img is not None,
                    'colors': final_colors
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

@csrf_exempt
def create_jewelry_type(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        
        if not name:
            return JsonResponse({'success': False, 'error': 'Name is required'})
        
        # Check if a jewelry type with this name already exists
        if JewelryType.objects.filter(name=name).exists():
            return JsonResponse({'success': False, 'error': 'A jewelry type with this name already exists'})
        
        # Generate a unique ID
        unique_id = str(uuid.uuid4())[:8]
        
        # Create the new jewelry type
        jewelry_type = JewelryType.objects.create(
            name=name,
            unique_id=unique_id
        )
        
        return JsonResponse({
            'success': True,
            'jewelry_type_id': jewelry_type.id,
            'jewelry_type_name': jewelry_type.name
        })
        
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@csrf_exempt
def edit_jewelry_type(request, id):
    if request.method == 'POST':
        name = request.POST.get('name')

        if not name:
            return JsonResponse({'success': False, 'error': 'Name is required'})

        try:
            jewelry_type = JewelryType.objects.get(id=id)
            jewelry_type.name = name
            jewelry_type.save()
            return JsonResponse({'success': True})
        except JewelryType.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Jewelry Type not found'})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})


@csrf_exempt
def delete_jewelry_type(request, id):
    if request.method == 'DELETE':
        try:
            jewelry_type = JewelryType.objects.get(id=id)
            jewelry_type.delete()
            return JsonResponse({'success': True})
        except JewelryType.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Jewelry Type not found'})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})
