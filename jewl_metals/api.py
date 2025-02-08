import requests
from django.http import JsonResponse
from bs4 import BeautifulSoup

def fetch_metal_rates():
    base_url = "https://www.goldapi.io/api/"
    metals = {
        "XAU": "Gold",
        "XAG": "Silver",
        "XPT": "Platinum",
        "XPD": "Palladium"
    }
    currency = "INR"  # Change to "USD" if needed
    api_key = "goldapi-1709xism6trnzna-io"

    headers = {
        "x-access-token": api_key,
        "Content-Type": "application/json"
    }

    metal_rates = {}

    for symbol, name in metals.items():
        url = f"{base_url}{symbol}/{currency}/"
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()  # Handle errors

            data = response.json()

            # Extract all relevant fields with metal name
            metal_rates[symbol] = {
                "metal_name": name,  # Added metal name
                "symbol": data.get("metal"),
                "currency": data.get("currency"),
                "exchange": data.get("exchange"),
                "prev_close_price": data.get("prev_close_price"),
                "open_price": data.get("open_price"),
                "low_price": data.get("low_price"),
                "high_price": data.get("high_price"),
                "price": data.get("price"),
                "ask": data.get("ask"),
                "bid": data.get("bid"),
                "price_gram_24k": data.get("price_gram_24k"),
                "price_gram_22k": data.get("price_gram_22k"),
                "price_gram_21k": data.get("price_gram_21k"),
                "price_gram_20k": data.get("price_gram_20k"),
                "price_gram_18k": data.get("price_gram_18k"),
                "price_gram_16k": data.get("price_gram_16k"),
                "price_gram_14k": data.get("price_gram_14k"),
                "price_gram_10k": data.get("price_gram_10k"),
            }

        except requests.RequestException as e:
            metal_rates[symbol] = {
                "metal_name": name,  # Ensure name is always included
                "error": f"Failed to fetch data: {e}"
            }

    return metal_rates


# Django API View
def metal_rates_api(request):
    rates = fetch_metal_rates()
    return JsonResponse(rates)



def get_metal_prices(request):
    try:
        url = "https://www.goodreturns.in/gold-rates/"
        copper_url = "https://economictimes.indiatimes.com/commoditysummary/symbol-COPPER.cms"

        # Fetch the webpage
        response = requests.get(url)
        soup = BeautifulSoup(response.text, "html.parser")

        # Locate the gold price elements
        gold_22k_element = soup.find("td", string="22 Carat Gold (1 gram)")
        gold_24k_element = soup.find("td", string="24 Carat Gold (1 gram)")
        silver_element = soup.find("td", string="Silver (1 gram)")

        # Extract the prices safely
        gold_22k = gold_22k_element.find_next_sibling("td").text.strip() if gold_22k_element else "Not Found"
        gold_24k = gold_24k_element.find_next_sibling("td").text.strip() if gold_24k_element else "Not Found"
        silver_price = silver_element.find_next_sibling("td").text.strip() if silver_element else "Not Found"

        # Fetch copper prices
        response_copper = requests.get(copper_url)
        soup_copper = BeautifulSoup(response_copper.text, "html.parser")
        copper_price_element = soup_copper.find("span", {"class": "commodity-price"})
        copper_price = copper_price_element.text.strip() if copper_price_element else "Not Found"

        # Brass price (Dummy value as it is not listed on websites)
        brass_price = "₹571 per kg (approx)"

        return JsonResponse({
            "gold_22k": gold_22k,
            "gold_24k": gold_24k,
            "silver": silver_price,
            "copper": copper_price,
            "brass": brass_price
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)