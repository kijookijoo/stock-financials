from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client_openai = None
if OPENAI_API_KEY:
    client_openai = AsyncOpenAI(api_key=OPENAI_API_KEY)

@router.get("/intro", response_class=PlainTextResponse)
async def get_intro(ticker: str):
    if not client_openai:
        return "OpenAI client not configured."
        
    response = await client_openai.chat.completions.create(
        model="gpt-4o-mini", 
        messages=[
            {"role": "user", "content": f"Write a short introduction (max 30 words, neutral) for the company with ticker: {ticker}. Output only the plain text paragraph."}
        ]
    )
    return response.choices[0].message.content.strip()