from google import genai

# The client gets the API key from the environment variable `GEMINI_API_KEY`.
API_KEY = "AIzaSyBRcRYE2wJT4z2H5lrIWSTRmRBqO9ozAbY"
client = genai.Client(api_key=API_KEY)uv

# response = client.models.generate_content(
#     model="gemini-2.5-flash", contents="Who is Peter Thiel?",
# )

@app.get("/intro")
def get_info(ticker : str):
    response = client.models.generate_content(
        model="gemini-2.5-flash", 
        contents="Generate a ~30 word introdution about the company registered with the tiker" + ticker,
    )
    return { "intro" : response.text } 
    