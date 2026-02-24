from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import traceback

financials_router = None
company_info_router = None

try:
    from .companyInfo import router as company_info_router
except Exception:
    from companyInfo import router as company_info_router

try:
    from .financials import router as financials_router
except Exception:
    try:
        from financials import router as financials_router
    except Exception as e:
        print(f"Failed to import financials router: {e}")
        print(traceback.format_exc())

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

app.include_router(company_info_router)
if financials_router is not None:
    app.include_router(financials_router)
else:
    @app.get("/financials")
    async def financials_unavailable():
        return {
            "error": "Financials route is unavailable due to server import error.",
            "hint": "Check Vercel runtime logs for the original financials import exception."
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
