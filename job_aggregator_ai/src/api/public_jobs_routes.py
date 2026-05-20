from fastapi import APIRouter, Query
from src.utils.db_handler import db_handler

router = APIRouter(prefix="/api/jobs", tags=["Public Jobs"])

@router.get("/public")
async def get_public_jobs(
    search: str = "",
    location: str = "",
    jobType: str = "",
    workMode: str = "",
    source: str = "",
    experience: str = "",
    limit: int = Query(200, le=500),
):
    query = {}

    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"skills": {"$regex": search, "$options": "i"}},
        ]

    if location:
        query["location"] = {"$regex": location, "$options": "i"}

    if jobType:
        query["jobType"] = {"$regex": jobType, "$options": "i"}

    if workMode:
        query["workMode"] = {"$regex": workMode, "$options": "i"}

    if source:
        query["source"] = {"$regex": source, "$options": "i"}

    if experience:
        query["experience"] = {"$regex": experience, "$options": "i"}

    jobs = await db_handler.collection.find(query).limit(limit).to_list(length=limit)

    for job in jobs:
        job["_id"] = str(job["_id"])
        job["applicationCount"] = job.get("applicationCount", 0)
        job["viewCount"] = job.get("viewCount", 0)

    return {
        "success": True,
        "jobs": jobs,
        "count": len(jobs),
    }