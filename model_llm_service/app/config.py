import os
from dotenv import load_dotenv

load_dotenv()

def get_api_key():
    key = os.getenv("GOOGLE_LLM_API")
    if not key:
        raise RuntimeError("GOOGLE_LLM_API missing")
    return key