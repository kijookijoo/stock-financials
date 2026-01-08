from fastapi import APIRouter
import yfinance as yf
import os

# Configure yfinance to use /tmp for caching (crucial for Vercel/Serverless)
if os.access("/tmp", os.W_OK):
    yf.set_tz_cache_location("/tmp/yf_cache")

import httpx
import anyio

router = APIRouter()

# Simple in-memory cache to reduce latency for repeated searches
cache = {}

@router.get("/info")
async def get_company_info(ticker: str):
    ticker = ticker.upper()
    if ticker in cache:
        return cache[ticker]

    try:
        # yfinance info is a blocking I/O call, run it in a thread pool
        company = await anyio.to_thread.run_sync(yf.Ticker, ticker)
        info = await anyio.to_thread.run_sync(lambda: company.info)
        name = info.get("longName") or info.get("shortName") or ticker
    except Exception as e:
        print(f"Error fetching yfinance info: {e}")
        name = ticker
        
    logo_url = f"https://financialmodelingprep.com/image-stock/{ticker}.png"
    
    result = {
        "name": name, 
        "image": logo_url
    }
    cache[ticker] = result
    return result