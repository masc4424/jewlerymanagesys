import requests
from bs4 import BeautifulSoup
from datetime import datetime

# api.py (continued)
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
import json
from decimal import Decimal
from jewl_metals.models import Metal, MetalRate
from datetime import date

from django.http import JsonResponse
from .models import Metal, MetalRate
from django.db.models import Q
from datetime import date

# def get_ht_silver_rates():
#     """Scrapes live silver price from Hindustan Times and calculates rates for different quantities"""
#     url = "https://www.hindustantimes.com/silver-prices"

#     headers = {
#         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
#         "Referer": "https://www.google.com/",
#         "Accept-Language": "en-US,en;q=0.9",
#     }

#     try:
#         response = requests.get(url, headers=headers, timeout=10)
#         response.raise_for_status()

#         soup = BeautifulSoup(response.text, "html.parser")

#         # Extract silver price
#         price_box = soup.find("div", class_="gpBox silver")
#         if not price_box:
#             return {"error": "Silver price not found"}

#         silver_price_text = price_box.find("strong").text.replace("₹", "").strip()
#         silver_price_10g = float(silver_price_text)

#         # Calculate prices based on 1 gram
#         silver_price_1g = silver_price_10g / 10
#         silver_price_100g = silver_price_1g * 100
#         silver_price_1kg = silver_price_1g * 1000

#         # Extract date
#         date_box = soup.find("div", class_="commName").find("span")
#         date_text = date_box.text.strip() if date_box else datetime.today().strftime('%d %b, %Y')

#         return {
#             "silver_price": {
#                 "date": date_text,
#                 "1 gram": f"₹ {silver_price_1g:.2f}",
#                 "10 grams": f"₹ {silver_price_10g:.2f}",
#                 "100 grams": f"₹ {silver_price_100g:.2f}",
#                 "1 kg": f"₹ {silver_price_1kg:.2f}"
#             }
#         }

#     except requests.exceptions.RequestException as e:
#         return {"error": f"Failed to fetch silver rate: {e}"}

# def get_metal_prices(request):
#     """Django API view to return live silver rates"""
#     rates = get_ht_silver_rates()
#     return JsonResponse(rates)

def get_metals_data(request):
    metals = Metal.objects.all()
    data = []

    for index, metal in enumerate(metals, 1):
        today = date.today()

        # Get latest rate for today
        today_rate = MetalRate.objects.filter(
            metal=metal,
            date=today
        ).order_by('-id').first()  # Assuming 'id' increments over time

        rate_info = "N/A"

        if today_rate:
            base_weight = today_rate.weight
            rate_per_unit = None

            if base_weight > 0:
                if metal.unit == today_rate.unit:
                    rate_per_unit = today_rate.rate / base_weight
                elif metal.unit.lower() == 'gram' and today_rate.unit.lower() == 'kg':
                    rate_per_unit = today_rate.rate / (base_weight * 1000)
                elif metal.unit.lower() == 'kg' and today_rate.unit.lower() == 'gram':
                    rate_per_unit = today_rate.rate / (base_weight / 1000)
                else:
                    # fallback calculation
                    rate_per_unit = today_rate.rate / base_weight

            if rate_per_unit is not None:
                rate_info = f"{round(rate_per_unit, 2)} {today_rate.currency}/{metal.unit}"

        data.append({
            'id': metal.id,
            'sr_no': index,
            'metal_unique_id': metal.metal_unique_id,
            'name': metal.name,
            'in_stock': f"{metal.total_available_weight} {metal.unit}",
            'todays_rate': rate_info,
            'threshold': f"{metal.threshold_limit} {metal.threshold_unit}"
        })

    return JsonResponse({'data': data})

# Add a new metal
@require_http_methods(["POST"])
def add_metal(request):
    try:
        data = json.loads(request.body)
        
        metal = Metal.objects.create(
            metal_unique_id=data.get('metal_unique_id'),
            name=data.get('name'),
            total_available_weight=Decimal(data.get('total_available_weight', 0)),
            unit=data.get('unit', 'kg'),
            threshold_limit=Decimal(data.get('threshold_limit', 0)),
            threshold_unit=data.get('threshold_unit', 'kg')
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Metal added successfully',
            'id': metal.id
        })
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': str(e)
        }, status=400)

# Update an existing metal
@require_http_methods(["POST"])
def update_metal(request, metal_id):
    try:
        metal = get_object_or_404(Metal, id=metal_id)
        data = json.loads(request.body)
        
        metal.metal_unique_id = data.get('metal_unique_id', metal.metal_unique_id)
        metal.name = data.get('name', metal.name)
        metal.total_available_weight = Decimal(data.get('total_available_weight', metal.total_available_weight))
        metal.unit = data.get('unit', metal.unit)
        metal.threshold_limit = Decimal(data.get('threshold_limit', metal.threshold_limit))
        metal.threshold_unit = data.get('threshold_unit', metal.threshold_unit)
        metal.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Metal updated successfully'
        })
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': str(e)
        }, status=400)

# Delete a metal
@require_http_methods(["POST"])
def delete_metal(request, metal_id):
    try:
        metal = get_object_or_404(Metal, id=metal_id)
        metal.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Metal deleted successfully'
        })
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': str(e)
        }, status=400)

# Add a new rate for a metal
@require_http_methods(["POST"])
def add_rate(request):
    try:
        data = json.loads(request.body)
        metal_id = data.get('metal_id')
        metal = get_object_or_404(Metal, id=metal_id)
        
        # Check if a rate for today already exists with same parameters
        existing_rate = MetalRate.objects.filter(
            metal=metal,
            date=date.today(),
            weight=Decimal(data.get('weight')),
            unit=data.get('unit'),
            currency=data.get('currency')
        ).first()
        
        if existing_rate:
            # Update existing rate
            existing_rate.rate = Decimal(data.get('rate'))
            existing_rate.save()
            message = 'Rate updated successfully'
        else:
            # Create new rate
            MetalRate.objects.create(
                metal=metal,
                weight=Decimal(data.get('weight')),
                unit=data.get('unit'),
                currency=data.get('currency'),
                rate=Decimal(data.get('rate'))
            )
            message = 'Rate added successfully'
        
        return JsonResponse({
            'success': True,
            'message': message
        })
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': str(e)
        }, status=400)

# Get metal details by ID
@require_http_methods(["GET"])
def get_metal_details(request, metal_id):
    try:
        metal = get_object_or_404(Metal, id=metal_id)
        
        return JsonResponse({
            'success': True,
            'data': {
                'id': metal.id,
                'metal_unique_id': metal.metal_unique_id,
                'name': metal.name,
                'total_available_weight': float(metal.total_available_weight),
                'unit': metal.unit,
                'threshold_limit': float(metal.threshold_limit),
                'threshold_unit': metal.threshold_unit
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': str(e)
        }, status=400)