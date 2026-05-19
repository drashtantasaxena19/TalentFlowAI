from datetime import datetime
from urllib.parse import unquote

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from src.middleware.auth_middleware import get_current_user
from src.utils import db_handler

router = APIRouter(prefix="/applications", tags=["Applications"])


def get_db():
    return db_handler.db_handler.db


def serialize_doc(doc):
    if not doc:
        return None

    doc = dict(doc)

    if "_id" in doc:
        doc["_id"] = str(doc["_id"])

    for key, value in list(doc.items()):
        if isinstance(value, ObjectId):
            doc[key] = str(value)
        elif isinstance(value, datetime):
            doc[key] = value.isoformat()

    return doc


def require_candidate(user: dict):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if user.get("role", "").lower() != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can access this resource")

    return user


def get_user_email(user: dict):
    email = user.get("email", "")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid authenticated user")
    return email


@router.post("/apply")
async def apply_to_job(payload: dict, current_user: dict = Depends(get_current_user)):
    require_candidate(current_user)

    db = get_db()
    candidate_email = get_user_email(current_user)

    job_id = str(
        payload.get("jobId")
        or payload.get("_id")
        or payload.get("id")
        or payload.get("applyLink")
        or ""
    ).strip()

    apply_link = str(payload.get("applyLink") or payload.get("link") or "").strip()

    if not job_id:
        raise HTTPException(status_code=400, detail="Job id is required")

    existing = await db.applications.find_one(
        {
            "candidateEmail": candidate_email,
            "$or": [
                {"jobId": job_id},
                {"applyLink": apply_link} if apply_link else {"jobId": job_id},
            ],
        }
    )

    if existing:
        return {
            "success": True,
            "message": "Already applied",
            "alreadyApplied": True,
            "applied": True,
            "application": serialize_doc(existing),
        }

    application_doc = {
        "candidateEmail": candidate_email,
        "candidateName": current_user.get("name", ""),
        "jobId": job_id,
        "jobTitle": payload.get("title", ""),
        "company": payload.get("company", ""),
        "location": payload.get("location", ""),
        "source": payload.get("source", ""),
        "applyLink": apply_link,
        "employerEmail": payload.get("employerEmail", ""),
        "jobSkills": payload.get("skills", []),
        "jobDescription": payload.get("description", ""),
        "jobExperience": payload.get("experience", ""),
        "status": "applied",
        "appliedAt": datetime.utcnow(),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    result = await db.applications.insert_one(application_doc)
    saved = await db.applications.find_one({"_id": result.inserted_id})

    return {
        "success": True,
        "message": "Applied successfully",
        "applied": True,
        "application": serialize_doc(saved),
    }


@router.get("/my")
async def get_my_applications(current_user: dict = Depends(get_current_user)):
    require_candidate(current_user)

    db = get_db()
    candidate_email = get_user_email(current_user)

    cursor = db.applications.find({"candidateEmail": candidate_email}).sort("createdAt", -1)

    applications = []
    async for app in cursor:
        applications.append(serialize_doc(app))

    return {
        "success": True,
        "applications": applications,
    }


@router.get("/check/{job_id:path}")
async def check_applied_by_path(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    require_candidate(current_user)

    db = get_db()
    candidate_email = get_user_email(current_user)

    decoded_job_id = unquote(str(job_id or "").strip())

    existing = await db.applications.find_one(
        {
            "candidateEmail": candidate_email,
            "$or": [
                {"jobId": decoded_job_id},
                {"applyLink": decoded_job_id},
            ],
        }
    )

    return {
        "success": True,
        "applied": bool(existing),
        "alreadyApplied": bool(existing),
        "application": serialize_doc(existing),
    }


@router.get("/check")
async def check_applied_by_query(
    jobId: str = Query(default=""),
    applyLink: str = Query(default=""),
    current_user: dict = Depends(get_current_user),
):
    require_candidate(current_user)

    db = get_db()
    candidate_email = get_user_email(current_user)

    job_id = unquote(str(jobId or "").strip())
    apply_link = unquote(str(applyLink or "").strip())

    if not job_id and not apply_link:
        raise HTTPException(status_code=400, detail="jobId or applyLink is required")

    conditions = []
    if job_id:
        conditions.append({"jobId": job_id})
    if apply_link:
        conditions.append({"applyLink": apply_link})

    existing = await db.applications.find_one(
        {
            "candidateEmail": candidate_email,
            "$or": conditions,
        }
    )

    return {
        "success": True,
        "applied": bool(existing),
        "alreadyApplied": bool(existing),
        "application": serialize_doc(existing),
    }