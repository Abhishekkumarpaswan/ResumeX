import os

SECRET_KEY = os.getenv("SECRET_KEY", "resumex-secret-key")
ALGORITHM = "HS256"
HF_TOKEN = os.getenv("HF_TOKEN")