from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import os

app = FastAPI()
API_KEY = os.getenv("API_KEY")

origins = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],    
    allow_headers=["*"],     
)

@app.get("/info")
def root(ticker : str):
    return get_info(ticker)

def get_info(ticker: str):
    url = "https://api.api-ninjas.com/v1/logo?name=&ticker="
    headers = {
        "X-API-Key" : API_KEY
    }
    params = {
        "ticker" : ticker
    }
    
    res = requests.get(url, headers=headers, params=params)
    
    return res.json()
    
    