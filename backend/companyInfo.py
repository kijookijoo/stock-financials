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
    name = ticker

    try:
        async with httpx.AsyncClient() as client:
            url = f"https://financialmodelingprep.com/api/v3/profile/{ticker}?apikey={FMP_API_KEY}"
            response = await client.get(url)
            data = response.json()
            if data and isinstance(data, list) and len(data) > 0:
                name = data[0].get("companyName", ticker)
    except Exception as e:
        print(f"Error fetching FMP info: {e}")
        # Fallback to yfinance if FMP fails? Or just keep ticker.
        # Given the user's issue, avoiding yfinance is safer for speed.
        name = ticker
        
    logo_url = f"https://financialmodelingprep.com/image-stock/{ticker}.png"
    
    result = {
        "name": name, 
        "image": logo_url
    }
    cache[ticker] = result
    return result