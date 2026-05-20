import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv(
    "MONGO_URI"
)

DB_NAME = os.getenv(
    "DB_NAME"
)

USE_AI = os.getenv(
    "USE_AI",
    "false"
).lower() == "true"

USE_GROQ = os.getenv(
    "USE_GROQ",
    "true"
).lower() == "true"

GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY",
    ""
)

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.1-8b-instant"
)

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY",
    ""
)

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-2.0-flash"
)

JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "super-secret-key"
)

JWT_ALGORITHM = os.getenv(
    "JWT_ALGORITHM",
    "HS256"
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "10080"
    )
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
)

MODEL_NAME = os.getenv(
    "MODEL_NAME",
    "sentence-transformers/all-MiniLM-L6-v2"
)

RECOMMENDATION_CACHE_TTL = int(
    os.getenv(
        "RECOMMENDATION_CACHE_TTL",
        "900"
    )
)

MAX_JOB_LIMIT = int(
    os.getenv(
        "MAX_JOB_LIMIT",
        "5000"
    )
)

PREFETCH_BATCH_SIZE = int(
    os.getenv(
        "PREFETCH_BATCH_SIZE",
        "5"
    )
)