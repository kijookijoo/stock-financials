from fastapi import APIRouter
import yfinance as yf
import os

if os.access("/tmp", os.W_OK):
    yf.set_tz_cache_location("/tmp/yf_cache")

from dotenv import load_dotenv
import httpx
import anyio

load_dotenv()
router = APIRouter()



@router.get("/info")
async def get_company_info(ticker: str):
    ticker = ticker.upper()
    FMP_API_KEY = os.getenv("FMP_API_KEY")
    
    name = ticker
    logo_url = f"https://financialmodelingprep.com/image-stock/{ticker}.png"
    
    if not FMP_API_KEY:
        print("WARNING: FMP_API_KEY is not set in environment variables.")
        return {"name": name, "image": logo_url}

    try:
        async with httpx.AsyncClient() as client:
            # Using stable endpoint as per user's preference
            url = f"https://financialmodelingprep.com/stable/profile?symbol={ticker}&apikey={FMP_API_KEY}"
            response = await client.get(url)
            
            if response.status_code != 200:
                print(f"ERROR: FMP API returned status {response.status_code}")
                return {"name": name, "image": logo_url}
                
            data = response.json()
            
            # FMP's profile endpoint typically returns a list of dictionaries
            if data and isinstance(data, list) and len(data) > 0:
                profile = data[0]
                name = profile.get("companyName") or profile.get("name") or ticker
                logo_url = profile.get("image") or logo_url
                
            return {
                "name": name, 
                "image": logo_url
            }
                
    except Exception as e:
        print(f"EXCEPTION in get_company_info for {ticker}: {str(e)}")
        return {
            "name": name,
            "image": logo_url
        }