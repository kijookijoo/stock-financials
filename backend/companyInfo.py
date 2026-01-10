from fastapi import APIRouter
import yfinance as yf
import os

if os.access("/tmp", os.W_OK):
    yf.set_tz_cache_location("/tmp/yf_cache")

import httpx
import anyio

router = APIRouter()

cache = {}

@router.get("/info")
async def get_company_info(ticker: str):
    ticker = ticker.upper()
    if ticker in cache:
        print(f"CACHE HIT for {ticker}: {cache[ticker]}")  # Debug log
        return cache[ticker]

    FMP_API_KEY = "BJ1cS2zuvUHvTkUayuZjpImCuajub8Iv"
    
    # Default fallbacks
    name = ticker
    logo_url = f"https://financialmodelingprep.com/image-stock/{ticker}.png"
    

    try:
        async with httpx.AsyncClient() as client:
            url = f"https://financialmodelingprep.com/stable/profile?symbol={ticker}&apikey={FMP_API_KEY}"
            print(f"Calling API: {url}")  # Debug log
            response = await client.get(url)
            print(f"API Status Code: {response.status_code}")  # Debug log
            data = response.json()
            
            print(f"API Response for {ticker}:", data)  # Debug log
            
            if data and isinstance(data, list) and len(data) > 0:
                name = data[0].get("companyName", ticker)
                logo_url = data[0].get("image") or logo_url
                print(f"Extracted name: {name}")  # Debug log
            else:
                print(f"WARNING: Unexpected data structure: {data}")  # Debug log
                
            result = {
                "name": name, 
                "image": logo_url
            }
            cache[ticker] = result
            print(f"Returning result: {result}")  # Debug log
            return result
                
    except Exception as e:
        # Always return fallback data so frontend can show the card
        print(f"ERROR in get_company_info: {type(e).__name__}: {str(e)}")  # Debug log
        return {
            "name": name,
            "image": logo_url
        }