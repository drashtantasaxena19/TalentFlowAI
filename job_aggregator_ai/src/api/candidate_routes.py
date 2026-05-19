from datetime import datetime
import re
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from src.models.user_model import get_user_by_email, update_candidate_profile
from src.middleware.auth_middleware import get_current_user


candidate_router = APIRouter(prefix="/api/candidate", tags=["Candidate"])


class CandidateProfileRequest(BaseModel):
    fullName: str
    phone: str | None = ""
    location: str | None = ""
    currentRole: str | None = ""
    experience: str | None = ""
    linkedin: str | None = ""
    github: str | None = ""
    portfolio: str | None = ""
    qualification: str | None = ""
    course: str | None = ""
    college: str | None = ""
    university: str | None = ""
    education: str | None = ""
    skills: str | None = ""
    summary: str | None = ""


def safe_get(data: dict | None, key: str, default: Any = ""):
    if not isinstance(data, dict):
        return default

    value = data.get(key, default)
    return value if value is not None else default


def serialize_job_doc(doc: dict | None):
    if not doc:
        return None

    serialized = dict(doc)

    if "_id" in serialized:
        serialized["_id"] = str(serialized["_id"])

    for key, value in list(serialized.items()):
        if isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()

    return serialized

@candidate_router.post("/profile")
async def save_candidate_profile(
    payload: CandidateProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    email = safe_get(current_user, "email", "")
    role = safe_get(current_user, "role", "")

    if role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidate can save this profile",
        )

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid authenticated user",
        )

    user = await get_user_by_email(email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    profile_data = payload.model_dump()
    profile_data["email"] = email

    old_profile = user.get("candidateProfile", {}) or {}

    merged_profile = {
        **old_profile,
        **profile_data,
    }

    updated_user = await update_candidate_profile(email, merged_profile)

    return {
        "message": "Profile saved successfully",
        "profile": updated_user.get("candidateProfile", {}),
    }


@candidate_router.get("/profile")
async def get_candidate_profile(
    current_user: dict = Depends(get_current_user),
):
    email = safe_get(current_user, "email", "")
    role = safe_get(current_user, "role", "")

    if role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidate can view this profile",
        )

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid authenticated user",
        )

    user = await get_user_by_email(email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return {
        "profile": user.get("candidateProfile", {}),
    }


@candidate_router.get("/jobs/search")
async def search_candidate_jobs(
    q: str = "",
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
):
    role = safe_get(current_user, "role", "")

    if role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidate can search jobs",
        )

    from src.utils import db_handler

    db = db_handler.db_handler.db

    query_text = str(q or "").strip()
    safe_limit = max(1, min(int(limit or 100), 100))

    mongo_filter: dict[str, Any] = {
        "status": {"$ne": "closed"},
    }

    if query_text:
        regex = {
            "$regex": re.escape(query_text),
            "$options": "i",
        }

        mongo_filter["$or"] = [
            {"title": regex},
            {"company": regex},
            {"location": regex},
            {"salary": regex},
            {"experience": regex},
            {"description": regex},
            {"requirements": regex},
            {"responsibilities": regex},
            {"source": regex},
            {"jobType": regex},
            {"workMode": regex},
            {"skills": regex},
            {"applyLink": regex},
            {"hrEmail": regex},
            {"hrPhone": regex},
            {"employerEmail": regex},
            {"postedBy": regex},
        ]

    cursor = db.jobs.find(mongo_filter).sort("createdAt", -1).limit(safe_limit)

    jobs = []

    async for job in cursor:
        serialized_job = serialize_job_doc(job)

        if serialized_job:
            jobs.append(serialized_job)

    return {
        "success": True,
        "query": query_text,
        "count": len(jobs),
        "jobs": jobs,
    }