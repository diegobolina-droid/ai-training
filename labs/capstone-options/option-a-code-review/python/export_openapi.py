"""Write OpenAPI snapshot: python3 export_openapi.py"""
import json
from pathlib import Path

from main import app

if __name__ == "__main__":
    path = Path(__file__).with_name("openapi.json")
    path.write_text(json.dumps(app.openapi(), indent=2) + "\n", encoding="utf-8")
    print("Wrote", path)
