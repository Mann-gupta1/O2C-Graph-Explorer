import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "sap-o2c-data"
DB_PATH = BASE_DIR / "data" / "sap_o2c.db"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-2.0-flash"

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq" if GROQ_API_KEY else "gemini")
