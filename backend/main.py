from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Import routers from the other modules
from financials import router as financials_router
from companyInfo import router as company_info_router
from analysis import router as analysis_router

load_dotenv()

app = FastAPI()

# CORS Middleware configuration
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
