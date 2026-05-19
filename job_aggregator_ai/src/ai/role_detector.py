from src.ai.ai_resume_parser import parse_resume_ai, USE_AI


def fallback_role(text: str):
    text = (text or "").lower()

    if any(x in text for x in ["power bi", "tableau", "excel", "sql", "dashboard", "data analysis"]):
        return {"target_role": "Data Analyst", "role_category": "data"}

    if any(x in text for x in ["machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "nlp", "artificial intelligence"]):
        return {"target_role": "AI/ML Engineer", "role_category": "ai/ml"}

    if any(x in text for x in ["react", "node", "mongodb", "express", "mern"]):
        return {"target_role": "MERN Developer", "role_category": "development"}

    if any(x in text for x in ["fastapi", "django", "flask", "python"]):
        return {"target_role": "Python Developer", "role_category": "development"}

    if any(x in text for x in ["html", "css", "javascript", "tailwind", "frontend"]):
        return {"target_role": "Frontend Developer", "role_category": "development"}

    return {"target_role": "General Candidate", "role_category": "general"}


def detect_role(text: str):
    if USE_AI:
        data = parse_resume_ai(text)

        if data and data.get("role"):
            return {
                "target_role": str(data.get("role", "")).strip(),
                "role_category": "ai_detected",
                "source": data.get("source", "AI"),
            }

    role = fallback_role(text)
    role["source"] = "fallback"

    return role