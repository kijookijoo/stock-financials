from fastapi import APIRouter
import yfinance as yf
import os

if os.access("/tmp", os.W_OK):
    yf.set_tz_cache_location("/tmp/yf_cache")

import httpx
import anyio

router = APIRouter()



@router.get("/info")
async def get_company_info(ticker: str):
    ticker = ticker.upper()

    FMP_API_KEY = "pXnv76gJel1TqdW5Y74zOFPVkWPoh4gB"
    
    name = ticker
    logo_url = f"https://financialmodelingprep.com/image-stock/{ticker}.png"
    

    try:
        async with httpx.AsyncClient() as client:
            url = f"https://financialmodelingprep.com/stable/profile?symbol={ticker}&apikey={FMP_API_KEY}"
            response = await client.get(url)
            data = response.json()
            
            if data and isinstance(data, list) and len(data) > 0:
                name = data[0].get("companyName", ticker)
                logo_url = data[0].get("image") or logo_url
                
            result = {
                "name": name, 
                "image": logo_url
            }
            return result
                
    except Exception as e:
        return {
            "name": name,
            "image": logo_url
        }