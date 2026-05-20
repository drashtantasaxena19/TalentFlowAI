from typing import Optional

from sentence_transformers import SentenceTransformer

model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)

def detect_role(text: Optional[str] = ""):
    text = str(text or "").lower()

    role_patterns = {
        "Data Analyst": [
            "data analyst",
            "power bi",
            "sql",
            "tableau",
            "analytics",
        ],

        "AI/ML Engineer": [
            "machine learning",
            "deep learning",
            "artificial intelligence",
            "tensorflow",
            "pytorch",
            "nlp",
        ],

        "Python Developer": [
            "python",
            "fastapi",
            "django",
            "flask",
        ],

        "Frontend Developer": [
            "react",
            "frontend",
            "javascript",
            "tailwind",
            "html",
            "css",
        ],

        "Backend Developer": [
            "node",
            "express",
            "mongodb",
            "backend",
            "api",
        ],

        "Full Stack Developer": [
            "mern",
            "full stack",
            "react",
            "node",
        ],

        "Electrician": [
            "electrician",
            "electrical",
            "wiring",
            "maintenance",
        ],

        "Plumber": [
            "plumber",
            "pipe",
            "water",
            "fitting",
        ],

        "Mechanic": [
            "mechanic",
            "repair",
            "vehicle",
            "engine",
        ],

        "Ground Staff": [
            "ground staff",
            "airport",
            "aviation",
        ],

        "Driver": [
            "driver",
            "driving",
            "transport",
        ],

        "Teacher": [
            "teacher",
            "teaching",
            "faculty",
        ],

        "Manager": [
            "manager",
            "management",
            "operations",
        ],

        "Sales Executive": [
            "sales",
            "marketing",
            "business development",
        ],
    }

    best_role = "General Professional"

    best_score = 0

    for role, keywords in role_patterns.items():
        score = sum(
            1
            for keyword in keywords
            if keyword in text
        )

        if score > best_score:
            best_score = score
            best_role = role

    return best_role