from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException

from src.utils import db_handler
from src.models.company_model import CompanyProfilePayload, company_profile_doc


def get_db():
    return db_handler.db_handler.db


def serialize_doc(doc):
    if not doc:
        return None

    doc["_id"] = str(doc["_id"])

    for key, value in list(doc.items()):
        if isinstance(value, ObjectId):
            doc[key] = str(value)
        elif isinstance(value, datetime):
            doc[key] = value.isoformat()

    return doc


def require_employer(user: dict):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if user.get("role", "").lower() != "employer":
        raise HTTPException(
            status_code=403,
            detail="Only employers can access this resource",
        )

    return user


async def get_company_profile(user: dict):
    require_employer(user)
    db = get_db()

    profile = await db.company_profiles.find_one(
        {"employerEmail": user.get("email")}
    )

    return {
        "success": True,
        "profile": serialize_doc(profile),
    }


async def save_company_profile(payload: CompanyProfilePayload, user: dict):
    require_employer(user)
    db = get_db()

    doc = company_profile_doc(payload, user)
    existing = await db.company_profiles.find_one(
        {"employerEmail": user.get("email")}
    )

    if existing:
        doc["createdAt"] = existing.get("createdAt", datetime.utcnow())
        await db.company_profiles.update_one(
            {"_id": existing["_id"]},
            {"$set": doc},
        )
        saved = await db.company_profiles.find_one({"_id": existing["_id"]})
    else:
        doc["createdAt"] = datetime.utcnow()
        result = await db.company_profiles.insert_one(doc)
        saved = await db.company_profiles.find_one({"_id": result.inserted_id})

    return {
        "success": True,
        "message": "Company profile saved successfully",
        "profile": serialize_doc(saved),
    }


async def create_employer_job(payload: dict, user: dict):
    require_employer(user)
    db = get_db()

    now = datetime.utcnow()

    skills = payload.get("skills", [])
    if isinstance(skills, str):
        skills = [
            skill.strip()
            for skill in skills.split(",")
            if skill.strip()
        ]

    job_doc = {
        "title": str(payload.get("title", "")).strip(),
        "company": str(payload.get("company", "")).strip(),
        "location": str(payload.get("location", "")).strip(),
        "salary": str(payload.get("salary", "")).strip(),
        "experience": str(payload.get("experience", "")).strip(),
        "jobType": str(payload.get("jobType", "")).strip(),
        "workMode": str(payload.get("workMode", "")).strip(),
        "skills": skills,
        "description": str(payload.get("description", "")).strip(),
        "requirements": str(payload.get("requirements", "")).strip(),
        "responsibilities": str(payload.get("responsibilities", "")).strip(),
        "link": str(payload.get("link", "")).strip(),
        "hrEmail": str(payload.get("hrEmail", "")).strip(),
        "hrPhone": str(payload.get("hrPhone", "")).strip(),
        "deadline": str(payload.get("deadline", "")).strip(),
        "status": str(payload.get("status", "active")).strip() or "active",
        "source": "Employer",
        "postedBy": "employer",
        "employerEmail": user.get("email"),
        "createdAt": now,
        "updatedAt": now,
    }

    if not job_doc["title"]:
        raise HTTPException(status_code=400, detail="Job title is required")

    if not job_doc["company"]:
        company_profile = await db.company_profiles.find_one(
            {"employerEmail": user.get("email")}
        )
        job_doc["company"] = (
            company_profile.get("companyName", "")
            if company_profile
            else ""
        )

    result = await db.jobs.insert_one(job_doc)
    saved = await db.jobs.find_one({"_id": result.inserted_id})

    return {
        "success": True,
        "message": "Job posted successfully",
        "job": serialize_doc(saved),
    }


async def get_employer_jobs(user: dict):
    require_employer(user)
    db = get_db()

    jobs_cursor = db.jobs.find(
        {"employerEmail": user.get("email")}
    ).sort("createdAt", -1)

    jobs = [
        serialize_doc(job)
        async for job in jobs_cursor
    ]

    return {
        "success": True,
        "jobs": jobs,
    }


async def update_employer_job(job_id: str, payload: dict, user: dict):
    require_employer(user)
    db = get_db()

    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job id")

    existing = await db.jobs.find_one(
        {
            "_id": ObjectId(job_id),
            "employerEmail": user.get("email"),
        }
    )

    if not existing:
        raise HTTPException(status_code=404, detail="Job not found")

    allowed_fields = [
        "title",
        "company",
        "location",
        "salary",
        "experience",
        "jobType",
        "workMode",
        "skills",
        "description",
        "requirements",
        "responsibilities",
        "link",
        "hrEmail",
        "hrPhone",
        "deadline",
        "status",
    ]

    update_doc = {
        field: payload[field]
        for field in allowed_fields
        if field in payload
    }

    if "skills" in update_doc and isinstance(update_doc["skills"], str):
        update_doc["skills"] = [
            skill.strip()
            for skill in update_doc["skills"].split(",")
            if skill.strip()
        ]

    update_doc["updatedAt"] = datetime.utcnow()

    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": update_doc},
    )

    updated = await db.jobs.find_one({"_id": ObjectId(job_id)})

    return {
        "success": True,
        "message": "Job updated successfully",
        "job": serialize_doc(updated),
    }


async def delete_employer_job(job_id: str, user: dict):
    require_employer(user)
    db = get_db()

    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job id")

    result = await db.jobs.delete_one(
        {
            "_id": ObjectId(job_id),
            "employerEmail": user.get("email"),
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "success": True,
        "message": "Job deleted successfully",
    }


async def get_employer_dashboard(user: dict):
    require_employer(user)
    db = get_db()

    employer_email = user.get("email")

    total_jobs = await db.jobs.count_documents(
        {"employerEmail": employer_email}
    )

    active_jobs = await db.jobs.count_documents(
        {
            "employerEmail": employer_email,
            "status": "active",
        }
    )

    total_applicants = await db.applications.count_documents(
        {
            "$or": [
                {"employerEmail": employer_email},
                {"postedByEmployer": employer_email},
            ]
        }
    )

    shortlisted = await db.applications.count_documents(
        {
            "$or": [
                {"employerEmail": employer_email},
                {"postedByEmployer": employer_email},
            ],
            "status": "shortlisted",
        }
    )

    profile = await db.company_profiles.find_one(
        {"employerEmail": employer_email}
    )

    completion = 0
    if profile:
        fields = [
            "companyName",
            "industry",
            "website",
            "location",
            "size",
            "description",
            "logoUrl",
            "linkedin",
            "contactEmail",
            "contactPhone",
        ]
        filled = sum(1 for field in fields if profile.get(field))
        completion = round((filled / len(fields)) * 100)

    recent_jobs_cursor = db.jobs.find(
        {"employerEmail": employer_email}
    ).sort("createdAt", -1).limit(5)

    recent_jobs = [
        serialize_doc(job)
        async for job in recent_jobs_cursor
    ]

    return {
        "success": True,
        "stats": {
            "totalJobs": total_jobs,
            "activeJobs": active_jobs,
            "totalApplicants": total_applicants,
            "shortlisted": shortlisted,
            "profileCompletion": completion,
        },
        "recentJobs": recent_jobs,
        "companyProfile": serialize_doc(profile),
    }


def _safe_score(value):
    try:
        return int(float(value or 0))
    except Exception:
        return 0


def _fallback_ai_result():
    return {
        "matchScore": 0,
        "matchedSkills": [],
        "missingSkills": [],
        "strengths": [],
        "weaknesses": [],
        "interviewQuestions": [],
        "recommendation": "Needs Review",
        "aiStatus": "Needs Review",
        "aiInsights": "AI applicant analysis could not be generated for this record.",
    }


async def get_employer_applicants(user: dict):
    require_employer(user)
    db = get_db()

    employer_email = user.get("email")

    try:
        from src.ai.employer_candidate_matcher import analyze_candidate_match
    except Exception as error:
        print("❌ Employer candidate matcher import failed:", str(error))
        analyze_candidate_match = None

    applications_cursor = db.applications.find(
        {
            "$or": [
                {"employerEmail": employer_email},
                {"postedByEmployer": employer_email},
            ]
        }
    ).sort("appliedAt", -1)

    applications = [
        app
        async for app in applications_cursor
    ]

    enriched_applicants = []

    for app in applications:
        try:
            job = None
            job_id = app.get("jobId")

            if job_id and ObjectId.is_valid(str(job_id)):
                job = await db.jobs.find_one(
                    {
                        "_id": ObjectId(str(job_id)),
                        "employerEmail": employer_email,
                    }
                )

            if not job:
                job = {
                    "title": app.get("jobTitle") or app.get("title", ""),
                    "skills": app.get("jobSkills") or app.get("skills", []),
                    "description": app.get("jobDescription") or app.get("description", ""),
                    "experience": app.get("jobExperience") or app.get("experience", ""),
                }

            ai_result = _fallback_ai_result()

            if analyze_candidate_match:
                try:
                    ai_result = await analyze_candidate_match(job, app)
                except Exception as error:
                    print("❌ Applicant AI match failed:", str(error))
                    ai_result = _fallback_ai_result()

            enriched = {
                **app,
                "name": app.get("candidateName") or app.get("name", ""),
                "email": app.get("candidateEmail") or app.get("email", ""),
                "jobTitle": job.get("title") or app.get("jobTitle") or app.get("title", "Unknown Job"),
                "jobId": str(job.get("_id", app.get("jobId", ""))),
                "matchScore": ai_result.get("matchScore", 0),
                "matchedSkills": ai_result.get("matchedSkills", []),
                "missingSkills": ai_result.get("missingSkills", []),
                "strengths": ai_result.get("strengths", []),
                "weaknesses": ai_result.get("weaknesses", []),
                "interviewQuestions": ai_result.get("interviewQuestions", []),
                "recommendation": ai_result.get("recommendation", "Needs Review"),
                "aiStatus": ai_result.get("aiStatus", "Needs Review"),
                "aiInsights": ai_result.get("aiInsights", ""),
            }

            enriched_applicants.append(
                serialize_doc(enriched)
            )

        except Exception as error:
            print("❌ Applicant enrichment failed:", str(error))

            fallback_app = {
                **app,
                "name": app.get("candidateName") or app.get("name", ""),
                "email": app.get("candidateEmail") or app.get("email", ""),
                "jobTitle": app.get("jobTitle") or app.get("title", "Unknown Job"),
                "jobId": str(app.get("jobId", "")),
                "matchScore": 0,
                "matchedSkills": [],
                "missingSkills": [],
                "strengths": [],
                "weaknesses": [],
                "interviewQuestions": [],
                "recommendation": "Needs Review",
                "aiStatus": "Needs Review",
                "aiInsights": "Applicant record loaded, but AI enrichment failed.",
            }

            enriched_applicants.append(
                serialize_doc(fallback_app)
            )

    enriched_applicants.sort(
        key=lambda item: _safe_score(item.get("matchScore", 0)),
        reverse=True,
    )

    total = len(enriched_applicants)

    shortlisted = len(
        [
            app
            for app in enriched_applicants
            if str(app.get("status", "")).lower() == "shortlisted"
        ]
    )

    pending = len(
        [
            app
            for app in enriched_applicants
            if str(app.get("status", "applied")).lower()
            in ["applied", "pending", "under review", "review"]
        ]
    )

    strong_matches = len(
        [
            app
            for app in enriched_applicants
            if _safe_score(app.get("matchScore", 0)) >= 80
        ]
    )

    return {
        "success": True,
        "stats": {
            "totalApplicants": total,
            "shortlisted": shortlisted,
            "pendingReview": pending,
            "strongMatches": strong_matches,
        },
        "applicants": enriched_applicants,
    }


async def update_applicant_status(application_id: str, payload: dict, user: dict):
    require_employer(user)
    db = get_db()

    if not ObjectId.is_valid(application_id):
        raise HTTPException(status_code=400, detail="Invalid application id")

    status = str(payload.get("status", "")).strip().lower()

    allowed = [
        "applied",
        "pending",
        "under review",
        "shortlisted",
        "rejected",
        "interview",
    ]

    if status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid applicant status")

    result = await db.applications.update_one(
        {
            "_id": ObjectId(application_id),
            "$or": [
                {"employerEmail": user.get("email")},
                {"postedByEmployer": user.get("email")},
            ],
        },
        {
            "$set": {
                "status": status,
                "updatedAt": datetime.utcnow(),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")

    updated = await db.applications.find_one(
        {"_id": ObjectId(application_id)}
    )

    return {
        "success": True,
        "message": f"Applicant marked as {status}",
        "application": serialize_doc(updated),
    }


async def rank_candidates_for_job(job_id: str, user: dict):
    require_employer(user)
    db = get_db()

    try:
        from src.ai.employer_candidate_matcher import analyze_candidate_match
    except Exception as error:
        print("❌ Employer candidate matcher import failed:", str(error))
        analyze_candidate_match = None

    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job id")

    job = await db.jobs.find_one(
        {
            "_id": ObjectId(job_id),
            "employerEmail": user.get("email"),
        }
    )

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    applications_cursor = db.applications.find(
        {
            "jobId": job_id,
            "$or": [
                {"employerEmail": user.get("email")},
                {"postedByEmployer": user.get("email")},
            ],
        }
    )

    applications = [
        app
        async for app in applications_cursor
    ]

    ranked = []

    for app in applications:
        ai_result = _fallback_ai_result()

        if analyze_candidate_match:
            try:
                ai_result = await analyze_candidate_match(job, app)
            except Exception as error:
                print("❌ Candidate ranking AI failed:", str(error))
                ai_result = _fallback_ai_result()

        app["matchScore"] = ai_result.get("matchScore", 0)
        app["matchedSkills"] = ai_result.get("matchedSkills", [])
        app["missingSkills"] = ai_result.get("missingSkills", [])
        app["strengths"] = ai_result.get("strengths", [])
        app["weaknesses"] = ai_result.get("weaknesses", [])
        app["interviewQuestions"] = ai_result.get("interviewQuestions", [])
        app["recommendation"] = ai_result.get("recommendation", "Needs Review")
        app["aiStatus"] = ai_result.get("aiStatus", "Needs Review")
        app["aiInsights"] = ai_result.get("aiInsights", "")

        ranked.append(
            serialize_doc(app)
        )

    ranked.sort(
        key=lambda item: _safe_score(item.get("matchScore", 0)),
        reverse=True,
    )

    return {
        "success": True,
        "job": serialize_doc(job),
        "rankedCandidates": ranked,
    }