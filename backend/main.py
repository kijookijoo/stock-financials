from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from sec_downloader import Downloader
from sec_downloader.types import RequestedFilings
from bs4 import BeautifulSoup
import httpx
import os
import anyio
import asyncio
from dotenv import load_dotenv

# Import routers
from financials import router as financials_router
from companyInfo import router as company_info_router
from analysis import router as analysis_router

load_dotenv()

app = FastAPI()

# Root health check endpoint for Vercel
@app.get("/")
async def root():
    return {"message": "Backend is running", "environment": os.environ.get("VERCEL", "local")}

@app.middleware("http")
async def log_errors(request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        import traceback
        print(f"CRITICAL ERROR: {str(e)}")
        print(traceback.format_exc())
        raise e

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(financials_router)
app.include_router(company_info_router)
app.include_router(analysis_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
