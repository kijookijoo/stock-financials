from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import traceback
import anyio
import time

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
CASE_CACHE_TTL_SECONDS = 600
CASE_CACHE = {}

# Root health check endpoint for Vercel
@app.get("/")
async def root():
    return {"message": "Backend is running", "environment": os.environ.get("VERCEL", "local")}


def _generate_intro(name: str) -> str:
    fallback = f"{name} is a publicly traded company."
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return fallback

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            input=[
                {
                    "role": "system",
                    "content": "Write a 40-word max sentence company overview for retail investors. Be Specific, avoiding generic terms like cutting-edge, leading, robust.",
                },
                {
                    "role": "user",
                    "content": f"Company: {name}",
                },
            ],
            max_output_tokens=120,
        )
        text = (response.output_text or "").strip()
        return text if text else fallback
    except Exception as e:
        print(f"Intro generation failed: {e}")
        print(traceback.format_exc())
        return fallback


@app.get("/intro")
async def intro(name: str):
    return await anyio.to_thread.run_sync(_generate_intro, name)


class CompanyCaseRequest(BaseModel):
    name: str
    stance: str = "bull"
    ticker: str | None = None
    intro: str | None = None


def _generate_company_case(name: str, stance: str, ticker: str | None = None, intro: str | None = None) -> str:
    stance_key = (stance or "").strip().lower()
    if stance_key not in {"bull", "bear"}:
        stance_key = "bull"

    fallback = (
        f"Bull case for {name}: focus on growth, margins, and execution."
        if stance_key == "bull"
        else f"Bear case for {name}: focus on valuation, competition, and execution risk."
    )

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return fallback

    cache_key = f"{name}|{ticker or ''}|{stance_key}|{(intro or '').strip()[:180]}"
    now = time.time()
    cached = CASE_CACHE.get(cache_key)
    if cached and (now - cached["ts"]) < CASE_CACHE_TTL_SECONDS:
        return cached["text"]

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        stance_user_prompt = (
            "Produce a balanced BULL case for this company."
            if stance_key == "bull"
            else "Produce a balanced BEAR case for this company."
        )
        context_lines = [f"Company: {name}"]
        if ticker:
            context_lines.append(f"Ticker: {ticker}")
        if intro:
            context_lines.append(f"Context summary: {intro[:450]}")

        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            input=[
                {
                    "role": "system",
                    "content": (
                        "You are a concise equity analyst for retail investors. "
                        "Return exactly 4 bullets. Each bullet must be <= 18 words. "
                        "Be concrete, avoid hype, avoid generic claims, and avoid making up recent facts."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"{stance_user_prompt}\n"
                        "Format: '- <point>' lines only.\n"
                        "Use this context:\n"
                        f"{chr(10).join(context_lines)}"
                    ),
                },
            ],
            max_output_tokens=180,
        )
        text = (response.output_text or "").strip()
        final_text = text if text else fallback
        CASE_CACHE[cache_key] = {"ts": now, "text": final_text}
        return final_text
    except Exception as e:
        print(f"Company case generation failed: {e}")
        print(traceback.format_exc())
        return fallback


@app.post("/company-case")
async def company_case(payload: CompanyCaseRequest):
    text = await anyio.to_thread.run_sync(
        _generate_company_case,
        payload.name,
        payload.stance,
        payload.ticker,
        payload.intro,
    )
    return {"stance": payload.stance, "content": text}

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
