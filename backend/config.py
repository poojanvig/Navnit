import os
from dotenv import load_dotenv

load_dotenv()

CASPARSER_API_KEY = os.getenv("CASPARSER_API_KEY", "")
CASPARSER_BASE_URL = "https://api.casparser.in"
JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 72
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./navnit.db")
