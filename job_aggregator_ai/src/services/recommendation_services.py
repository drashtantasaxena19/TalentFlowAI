from src.ai.matcher import match_jobs
from src.utils.db_handler import db_handler


async def get_user_jobs(email: str, limit: int | None = None):
    user = await db_handler.db["users"].find_one({"email": email})

    if not user:
        return {
            "detected_role": {},
            "ai_enabled": False,
            "total_jobs": 0,
            "jobs": []
        }

    candidate_profile = user.get("candidateProfile", {})

    resume_text = (
        candidate_profile.get("resumeText")
        or candidate_profile.get("resume_text")
        or user.get("resume_text")
        or candidate_profile.get("summary")
        or ""
    )

    skills = candidate_profile.get("skills") or user.get("skills") or []

    if isinstance(skills, list):
        skills_text = " ".join(skills)
    else:
        skills_text = str(skills)

    final_text = f"{resume_text} {skills_text}".strip()

    if not final_text:
        return {
            "detected_role": {},
            "ai_enabled": False,
            "total_jobs": 0,
            "jobs": [],
            "message": "Please upload resume or complete profile first"
        }

    return await match_jobs(
        resume_text=final_text,
        limit=limit
    )