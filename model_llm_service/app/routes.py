from flask import Blueprint, request, jsonify
from app.llm import LLMService
from app.config import get_api_key

bp = Blueprint("api", __name__)

llm = LLMService(get_api_key())

@bp.post("/flash")
def flash():
    prompt = request.json.get("prompt")
    if not prompt:
        return jsonify({"error": "Missing prompt"}), 400

    text = llm.call(prompt, "gemini-2.5-flash")
    return jsonify({"text": text})

@bp.post("/professional")
def professional():
    prompt = request.json.get("prompt")
    if not prompt:
        return jsonify({"error": "Missing prompt"}), 400

    text = llm.call(prompt, "gemini-2.5-pro")
    return jsonify({"text": text})

@bp.get("/health")
def health():
    return jsonify({"status": "ok"})