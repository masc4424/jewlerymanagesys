import requests
from django.http import JsonResponse
from bs4 import BeautifulSoup
from datetime import datetime

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
