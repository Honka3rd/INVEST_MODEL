from flask import Flask
from app.routes import bp
import os

def create_app():
    app = Flask(__name__)
    app.register_blueprint(bp)
    return app

app = create_app()
host = os.getenv("FLASK_HOST", "0.0.0.0")
port = int(os.getenv("FLASK_PORT", "8000"))
if __name__ == "__main__":
    app.run(host=host, port=port, debug=True)
