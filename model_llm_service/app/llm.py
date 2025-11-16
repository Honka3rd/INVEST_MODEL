import google.generativeai as genai

PREFIX = (
    "Omit the opening remarks, such as: Okay, I will..., liked expressions, "
    "and only respond with the main content. "
)

class LLMService:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)

    def call(self, prompt: str, model: str):
        full_prompt = PREFIX + prompt
        response = genai.GenerativeModel(model).generate_content(full_prompt)
        return getattr(response, "text", "") or ""