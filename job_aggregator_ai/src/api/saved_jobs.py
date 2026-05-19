from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from src.utils.db_handler import db_handler
from src.middleware.auth_middleware import get_current_user
from src.models.user_model import (
    get_user_subscription,
    increment_saved_jobs_usage,
    decrement_saved_jobs_usage,
)

router = APIRouter(prefix="/api/saved-jobs", tags=["Saved Jobs"])

saved_jobs_collection = db_handler.saved_jobs_collection


class SavedJobRequest(BaseModel):
    title: str = Field(..., min_length=1)
    company: str = Field(..., min_length=1)

    location: Optional[str] = ""
    salary: Optional[str] = ""
    experience: Optional[str] = ""
    match: Optional[str] = ""

    applyLink: str = Field(..., min_length=1)

    hrEmail: Optional[str] = ""
    hrPhone: Optional[str] = ""
    chatLink: Optional[str] = ""

    reason: Optional[str] = ""
    learning: Optional[List[str]] = []
    careerAdvice: Optional[str] = ""

    requiredSkills: Optional[List[str]] = []
    matchedSkills: Optional[List[str]] = []
    missingSkills: Optional[List[str]] = []

    source: Optional[str] = ""
    analysisSource: Optional[str] = ""


def serialize_job(job: dict):
    job["_id"] = str(job["_id"])
    job["savedAt"] = str(job.get("savedAt", ""))
    job["updatedAt"] = str(job.get("updatedAt", ""))
    return job


def get_saved_jobs_limit(plan: str):
    limits = {
        "free": 5,
        "pro": -1,
        "premium": -1,
    }

    return limits.get(plan, 5)


@router.post("/save")
async def save_job(
    job: SavedJobRequest,
    current_user: dict[str, str] = Depends(get_current_user),
):
    email = current_user.get("email", "")
    role = current_user.get("role", "")

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid authenticated user",
        )

    if role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can save jobs",
        )

    subscription_data = await get_user_subscription(email)

    if not subscription_data:
        raise HTTPException(
            status_code=404,
            detail="User subscription not found",
        )

    current_plan = (
        subscription_data.get("subscription", {})
        .get("plan", "free")
        .lower()
    )

    current_saved_count = (
        subscription_data.get("usage", {})
        .get("saved_jobs_count", 0)
    )

    limit = get_saved_jobs_limit(current_plan)

    existing = await saved_jobs_collection.find_one({
        "email": email,
        "applyLink": job.applyLink,
    })

    if existing:
        return {
            "success": True,
            "message": "Job already saved",
            "job": serialize_job(existing),
        }

    if limit != -1 and current_saved_count >= limit:
        raise HTTPException(
            status_code=403,
            detail="Free plan limit reached. Upgrade to Pro for unlimited saved jobs."
        )

    data = job.dict()
    data["email"] = email
    data["savedAt"] = datetime.utcnow()
    data["updatedAt"] = datetime.utcnow()

    result = await saved_jobs_collection.insert_one(data)

    await increment_saved_jobs_usage(email)

    saved_job = await saved_jobs_collection.find_one({
        "_id": result.inserted_id,
    })

    return {
        "success": True,
        "message": "Job saved successfully",
        "job": serialize_job(saved_job),
        "plan": current_plan,
    }


@router.get("/")
async def get_saved_jobs(
    current_user: dict[str, str] = Depends(get_current_user),
):
    email = current_user.get("email", "")
    role = current_user.get("role", "")

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid authenticated user",
        )

    if role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can view saved jobs",
        )

    jobs = await saved_jobs_collection.find({
        "email": email,
    }).sort("savedAt", -1).to_list(500)

    jobs = [serialize_job(job) for job in jobs]

    return {
        "success": True,
        "count": len(jobs),
        "jobs": jobs,
    }


@router.delete("/remove")
async def remove_saved_job(
    applyLink: str = Query(...),
    current_user: dict[str, str] = Depends(get_current_user),
):
    email = current_user.get("email", "")
    role = current_user.get("role", "")

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid authenticated user",
        )

    if role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can remove saved jobs",
        )

    result = await saved_jobs_collection.delete_one({
        "email": email,
        "applyLink": applyLink,
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Saved job not found",
        )

    await decrement_saved_jobs_usage(email)

    return {
        "success": True,
        "message": "Job removed successfully",
    }