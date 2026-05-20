from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from src.middleware.auth_middleware import get_current_user
from src.utils.db_handler import db_handler

router = APIRouter(
    prefix="/api/applications",
    tags=["Applications"],
)

applications_collection = db_handler.applications_collection


def serialize_application(application: dict):
    application["_id"] = str(application["_id"])
    return application


@router.post("/apply")
async def apply_to_job(
    payload: dict,
    current_user: dict = Depends(get_current_user),
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
            detail="Only candidates can apply for jobs",
        )

    job_id = str(payload.get("jobId", ""))

    if not job_id:
        raise HTTPException(
            status_code=400,
            detail="Job ID missing",
        )

    existing = await applications_collection.find_one(
        {
            "email": email,
            "jobId": job_id,
        }
    )

    if existing:
        return {
            "success": True,
            "alreadyApplied": True,
            "message": "Application already tracked.",
        }

    employer_email = (
        payload.get("employerEmail", "")
        or payload.get("postedByEmployer", "")
        or payload.get("postedBy", "")
    )

    data = {
        "email": email,
        "candidateEmail": email,
        "candidateName": current_user.get("name", ""),
        "jobId": job_id,
        "title": payload.get("title", ""),
        "jobTitle": payload.get("title", ""),
        "company": payload.get("company", ""),
        "location": payload.get("location", ""),
        "source": payload.get("source", ""),
        "applyLink": payload.get("applyLink", ""),
        "employerEmail": employer_email,
        "postedByEmployer": employer_email,
        "skills": payload.get("skills", []),
        "jobSkills": payload.get("skills", []),
        "description": payload.get("description", ""),
        "jobDescription": payload.get("description", ""),
        "experience": payload.get("experience", ""),
        "jobExperience": payload.get("experience", ""),
        "status": "applied",
        "appliedAt": datetime.utcnow(),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    result = await applications_collection.insert_one(data)

    application = await applications_collection.find_one(
        {
            "_id": result.inserted_id,
        }
    )

    return {
        "success": True,
        "applied": True,
        "message": "Application tracked successfully.",
        "application": serialize_application(application),
    }


@router.get("/my")
async def get_my_applications(
    current_user: dict = Depends(get_current_user),
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
            detail="Only candidates can view applications",
        )

    applications_cursor = applications_collection.find(
        {
            "email": email,
        }
    ).sort("appliedAt", -1)

    applications = await applications_cursor.to_list(500)

    serialized = [
        serialize_application(app)
        for app in applications
    ]

    return {
        "success": True,
        "applications": serialized,
    }


@router.get("/check/{job_id}")
async def check_applied_job(
    job_id: str,
    current_user: dict = Depends(get_current_user),
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
            detail="Only candidates can check applications",
        )

    existing = await applications_collection.find_one(
        {
            "email": email,
            "jobId": str(job_id),
        }
    )

    return {
        "success": True,
        "applied": bool(existing),
    }