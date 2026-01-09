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
        return cache[ticker]

    FMP_API_KEY = "BJ1cS2zuvUHvTkUayuZjpImCuajub8Iv"
    
    # Default fallbacks
    name = ticker
    logo_url = f"https://financialmodelingprep.com/image-stock/{ticker}.png"

    try:
        async with httpx.AsyncClient() as client:
            url = f"https://financialmodelingprep.com/api/v3/profile/{ticker}?apikey={FMP_API_KEY}"
            response = await client.get(url)
            data = response.json()
            
            if data and isinstance(data, list) and len(data) > 0:
                name = data[0].get("companyName", ticker)
                logo_url = data[0].get("image") or logo_url
                
            result = {
                "name": name, 
                "image": logo_url
            }
            cache[ticker] = result
            return result
                
    except Exception as e:
        # Always return fallback data so frontend can show the card
        return {
            "name": name,
            "image": logo_url
        }