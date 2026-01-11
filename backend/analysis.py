from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

@router.get("/intro", response_class=PlainTextResponse)
async def get_intro(name: str):
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return "Error: OpenAI client not configured (Missing OPENAI_API_KEY in Environment Variables)."
        
        is_vercel = os.environ.get("VERCEL") == "1"
        
        client_openai = AsyncOpenAI(api_key=api_key)
            
        response = await client_openai.chat.completions.create(
            model="gpt-4o-mini", 
            messages=[
                {"role": "user", "content": f"Objective/Neutral: 30-word max neutral intro for investors. {name}."}
            ]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        import traceback
        return f"detailed_error: {str(e)}\nTraceback: {traceback.format_exc()}"