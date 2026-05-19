from datetime import datetime, timedelta
from typing import Optional, Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from src.middleware.auth_middleware import require_roles
from src.utils.db_handler import db_handler

from pydantic import BaseModel, EmailStr, Field
from src.services.auth_service import hash_password

admin_router = APIRouter(prefix="/admin", tags=["Admin"])

users_collection = db_handler.db["users"]
jobs_collection = db_handler.db["jobs"]
payments_collection = db_handler.db["payments"]
company_profiles_collection = db_handler.db["company_profiles"]


# =========================
# HELPERS
# =========================
def serialize_value(value: Any):
    if isinstance(value, ObjectId):
        return str(value)

    if isinstance(value, datetime):
        return value.isoformat()

    if isinstance(value, list):
        return [serialize_value(item) for item in value]

    if isinstance(value, dict):
        return {key: serialize_value(val) for key, val in value.items()}

    return value


def serialize_doc(doc: dict | None):
    if not doc:
        return None

    return serialize_value(doc)


def safe_int(value):
    try:
        return int(value or 0)
    except Exception:
        return 0


def get_job_status(job: dict):
    status_value = str(
        job.get("status") or job.get("jobStatus") or job.get("state") or ""
    ).lower()

    is_active = job.get("isActive")

    if status_value in ["closed", "inactive", "rejected", "deleted", "spam"]:
        return "closed"

    if is_active is False:
        return "closed"

    return "active"


def get_company_status(company: dict, employer: dict | None = None):
    status_value = str(
        company.get("verificationStatus") or company.get("status") or ""
    ).lower()

    if company.get("isVerified") is True or status_value in ["verified", "approved"]:
        return "verified"

    if status_value in ["rejected", "blocked"]:
        return "rejected"

    if employer and employer.get("isActive") is False:
        return "blocked"

    return "pending"


def build_text_filter(search: Optional[str], fields: list[str]):
    if not search:
        return {}

    return {"$or": [{field: {"$regex": search, "$options": "i"}} for field in fields]}


async def ensure_admin(current_user=Depends(require_roles(["admin"]))):
    return current_user


# =========================
# Admin Creation
# =========================
class CreateAdminPayload(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=8)


@admin_router.post("/users/create-admin")
async def admin_create_admin_user(
    payload: CreateAdminPayload,
    current_user: dict = Depends(ensure_admin),
):
    existing = await users_collection.find_one({"email": payload.email.lower()})

    if existing:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists",
        )

    admin_data = {
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "password": hash_password(payload.password),
        "role": "admin",
        "companyName": "",
        "isActive": True,
        "subscription": {
            "plan": "admin",
            "status": "active",
            "start_date": datetime.utcnow(),
            "end_date": None,
            "auto_renew": False,
        },
        "usage": {},
        "candidateProfile": {},
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "createdByAdmin": current_user.get("email"),
    }

    await users_collection.insert_one(admin_data)

    admin_data.pop("password", None)

    return {
        "success": True,
        "message": "Admin user created successfully",
        "user": serialize_doc(admin_data),
    }



# =========================
# DASHBOARD
# =========================
@admin_router.get("/dashboard")
async def admin_dashboard(current_user: dict = Depends(ensure_admin)):
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    recent_cutoff = now - timedelta(days=7)

    total_users = await users_collection.count_documents({})
    total_candidates = await users_collection.count_documents({"role": "candidate"})
    total_employers = await users_collection.count_documents({"role": "employer"})
    total_admins = await users_collection.count_documents({"role": "admin"})

    total_jobs = await jobs_collection.count_documents({})

    all_jobs = await jobs_collection.find(
        {}, {"status": 1, "jobStatus": 1, "state": 1, "isActive": 1}
    ).to_list(10000)
    active_jobs = len([job for job in all_jobs if get_job_status(job) == "active"])
    closed_jobs = max(total_jobs - active_jobs, 0)

    active_subscriptions = await users_collection.count_documents(
        {
            "subscription.status": "active",
            "subscription.plan": {"$nin": ["free", "employer_free", None, ""]},
        }
    )

    successful_payments = await payments_collection.find(
        {"status": {"$in": ["paid", "success", "captured", "verified"]}}
    ).to_list(10000)

    total_revenue = sum(
        safe_int(payment.get("amount")) for payment in successful_payments
    )

    monthly_revenue = sum(
        safe_int(payment.get("amount"))
        for payment in successful_payments
        if payment.get("createdAt") and payment.get("createdAt") >= month_start
    )

    recent_users = (
        await users_collection.find(
            {},
            {
                "password": 0,
            },
        )
        .sort("createdAt", -1)
        .limit(8)
        .to_list(8)
    )

    recent_payments = (
        await payments_collection.find({}).sort("createdAt", -1).limit(8).to_list(8)
    )

    recent_registrations = await users_collection.count_documents(
        {"createdAt": {"$gte": recent_cutoff}}
    )

    candidate_paid = await users_collection.count_documents(
        {
            "role": "candidate",
            "subscription.status": "active",
            "subscription.plan": {"$in": ["pro", "premium"]},
        }
    )

    employer_paid = await users_collection.count_documents(
        {
            "role": "employer",
            "subscription.status": "active",
            "subscription.plan": {"$in": ["employer_pro", "employer_enterprise"]},
        }
    )

    return {
        "success": True,
        "stats": {
            "totalUsers": total_users,
            "candidates": total_candidates,
            "employers": total_employers,
            "admins": total_admins,
            "activeSubscriptions": active_subscriptions,
            "revenue": total_revenue,
            "monthlyRevenue": monthly_revenue,
            "totalJobs": total_jobs,
            "activeJobs": active_jobs,
            "closedJobs": closed_jobs,
            "recentRegistrations": recent_registrations,
            "candidatePaidPlans": candidate_paid,
            "employerPaidPlans": employer_paid,
        },
        "recentUsers": [serialize_doc(user) for user in recent_users],
        "recentPayments": [serialize_doc(payment) for payment in recent_payments],
    }


# =========================
# USERS
# =========================
class UserStatusPayload(BaseModel):
    isActive: bool


@admin_router.get("/users")
async def admin_get_users(
    role: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    current_user: dict = Depends(ensure_admin),
):
    query = {}

    if role and role != "all":
        query["role"] = role

    query.update(build_text_filter(search, ["name", "email", "companyName"]))

    users = (
        await users_collection.find(query, {"password": 0})
        .sort("createdAt", -1)
        .to_list(1000)
    )

    return {
        "success": True,
        "count": len(users),
        "users": [serialize_doc(user) for user in users],
    }


@admin_router.patch("/users/{email}/status")
async def admin_update_user_status(
    email: str,
    payload: UserStatusPayload,
    current_user: dict = Depends(ensure_admin),
):
    if email == current_user.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot block own account",
        )

    result = await users_collection.update_one(
        {"email": email.lower()},
        {
            "$set": {
                "isActive": payload.isActive,
                "updatedAt": datetime.utcnow(),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    user = await users_collection.find_one({"email": email.lower()}, {"password": 0})

    return {
        "success": True,
        "message": "User status updated",
        "user": serialize_doc(user),
    }


@admin_router.delete("/users/{email}")
async def admin_delete_user(
    email: str,
    current_user: dict = Depends(ensure_admin),
):
    if email == current_user.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot delete own account",
        )

    result = await users_collection.delete_one({"email": email.lower()})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "success": True,
        "message": "User deleted successfully",
    }


# =========================
# COMPANIES
# =========================
class CompanyVerificationPayload(BaseModel):
    status: str


@admin_router.get("/companies")
async def admin_get_companies(
    search: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default="all"),
    current_user: dict = Depends(ensure_admin),
):
    employer_query = {"role": "employer"}
    employer_query.update(build_text_filter(search, ["name", "email", "companyName"]))

    employers = (
        await users_collection.find(employer_query, {"password": 0})
        .sort("createdAt", -1)
        .to_list(1000)
    )

    companies = []

    for employer in employers:
        profile = await company_profiles_collection.find_one(
            {
                "$or": [
                    {"employerEmail": employer.get("email")},
                    {"contactEmail": employer.get("email")},
                ]
            }
        )

        active_jobs = await jobs_collection.count_documents(
            {
                "$or": [
                    {"employerEmail": employer.get("email")},
                    {"postedBy": employer.get("email")},
                    {"email": employer.get("email")},
                ],
                "$and": [
                    {
                        "$or": [
                            {"isActive": {"$ne": False}},
                            {
                                "status": {
                                    "$nin": ["closed", "rejected", "deleted", "spam"]
                                }
                            },
                        ]
                    }
                ],
            }
        )

        company_doc = profile or {}

        company_status = get_company_status(company_doc, employer)

        if status_filter and status_filter != "all" and company_status != status_filter:
            continue

        companies.append(
            {
                "_id": str(profile.get("_id"))
                if profile and profile.get("_id")
                else str(employer.get("_id")),
                "companyName": company_doc.get("companyName")
                or employer.get("companyName")
                or employer.get("name")
                or "Unnamed Company",
                "industry": company_doc.get("industry", ""),
                "website": company_doc.get("website", ""),
                "location": company_doc.get("location", ""),
                "contactEmail": company_doc.get("contactEmail")
                or employer.get("email", ""),
                "employerEmail": employer.get("email", ""),
                "ownerName": employer.get("name", ""),
                "subscription": employer.get("subscription", {}),
                "activeJobs": active_jobs,
                "status": company_status,
                "createdAt": employer.get("createdAt"),
                "updatedAt": company_doc.get("updatedAt") or employer.get("updatedAt"),
            }
        )

    return {
        "success": True,
        "count": len(companies),
        "companies": serialize_value(companies),
    }


@admin_router.patch("/companies/{employer_email}/verification")
async def admin_verify_company(
    employer_email: str,
    payload: CompanyVerificationPayload,
    current_user: dict = Depends(ensure_admin),
):
    allowed = ["verified", "approved", "pending", "rejected"]

    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid verification status")

    employer = await users_collection.find_one(
        {"email": employer_email.lower(), "role": "employer"}
    )

    if not employer:
        raise HTTPException(status_code=404, detail="Employer not found")

    await company_profiles_collection.update_one(
        {"employerEmail": employer_email.lower()},
        {
            "$set": {
                "employerEmail": employer_email.lower(),
                "companyName": employer.get("companyName", ""),
                "verificationStatus": "verified"
                if payload.status == "approved"
                else payload.status,
                "isVerified": payload.status in ["verified", "approved"],
                "reviewedAt": datetime.utcnow(),
                "reviewedBy": current_user.get("email"),
                "updatedAt": datetime.utcnow(),
            }
        },
        upsert=True,
    )

    return {
        "success": True,
        "message": "Company verification updated",
    }


# =========================
# JOBS
# =========================
class JobModerationPayload(BaseModel):
    action: str


@admin_router.get("/jobs")
async def admin_get_jobs(
    search: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default="all"),
    current_user: dict = Depends(ensure_admin),
):
    query = {}
    query.update(
        build_text_filter(
            search, ["title", "company", "companyName", "location", "source"]
        )
    )

    jobs = await jobs_collection.find(query).sort("createdAt", -1).to_list(2000)

    final_jobs = []

    for job in jobs:
        computed_status = get_job_status(job)

        if (
            status_filter
            and status_filter != "all"
            and computed_status != status_filter
        ):
            continue

        employer_email = (
            job.get("employerEmail") or job.get("postedBy") or job.get("email") or ""
        )

        employer = None

        if employer_email:
            employer = await users_collection.find_one(
                {"email": employer_email}, {"password": 0}
            )

        job["computedStatus"] = computed_status
        job["employer"] = serialize_doc(employer) if employer else None

        final_jobs.append(serialize_doc(job))

    return {
        "success": True,
        "count": len(final_jobs),
        "jobs": final_jobs,
    }


@admin_router.patch("/jobs/{job_id}/moderate")
async def admin_moderate_job(
    job_id: str,
    payload: JobModerationPayload,
    current_user: dict = Depends(ensure_admin),
):
    allowed_actions = ["close", "activate", "spam", "reject"]

    if payload.action not in allowed_actions:
        raise HTTPException(status_code=400, detail="Invalid moderation action")

    try:
        object_id = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job id")

    update_map = {
        "close": {
            "status": "closed",
            "isActive": False,
        },
        "activate": {
            "status": "active",
            "isActive": True,
        },
        "spam": {
            "status": "spam",
            "isActive": False,
            "isSpam": True,
        },
        "reject": {
            "status": "rejected",
            "isActive": False,
        },
    }

    result = await jobs_collection.update_one(
        {"_id": object_id},
        {
            "$set": {
                **update_map[payload.action],
                "moderatedBy": current_user.get("email"),
                "moderatedAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")

    job = await jobs_collection.find_one({"_id": object_id})

    return {
        "success": True,
        "message": "Job moderated successfully",
        "job": serialize_doc(job),
    }


@admin_router.delete("/jobs/{job_id}")
async def admin_delete_job(
    job_id: str,
    current_user: dict = Depends(ensure_admin),
):
    try:
        object_id = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job id")

    result = await jobs_collection.delete_one({"_id": object_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "success": True,
        "message": "Job deleted successfully",
    }


# =========================
# PAYMENTS
# =========================
@admin_router.get("/payments")
async def admin_get_payments(
    search: Optional[str] = Query(default=None),
    role: Optional[str] = Query(default="all"),
    current_user: dict = Depends(ensure_admin),
):
    query = {}

    if role and role != "all":
        query["role"] = role

    query.update(
        build_text_filter(
            search, ["email", "plan", "razorpay_order_id", "razorpay_payment_id"]
        )
    )

    payments = await payments_collection.find(query).sort("createdAt", -1).to_list(2000)

    total_revenue = 0
    successful_count = 0
    failed_count = 0
    pending_count = 0
    candidate_revenue = 0
    employer_revenue = 0

    for payment in payments:
        status_value = str(payment.get("status") or "").lower()

        if status_value in ["paid", "success", "captured", "verified"]:
            amount = safe_int(payment.get("amount"))
            total_revenue += amount
            successful_count += 1

            if payment.get("role") == "employer":
                employer_revenue += amount
            else:
                candidate_revenue += amount

        elif status_value in ["failed", "cancelled"]:
            failed_count += 1
        else:
            pending_count += 1

    return {
        "success": True,
        "summary": {
            "totalRevenue": total_revenue,
            "candidateRevenue": candidate_revenue,
            "employerRevenue": employer_revenue,
            "successfulPayments": successful_count,
            "pendingPayments": pending_count,
            "failedPayments": failed_count,
            "totalPayments": len(payments),
        },
        "payments": [serialize_doc(payment) for payment in payments],
    }


# =========================
# SETTINGS
# =========================
@admin_router.get("/settings")
async def admin_get_settings(current_user: dict = Depends(ensure_admin)):
    settings = await db_handler.db["platform_settings"].find_one({"key": "main"})

    if not settings:
        settings = {
            "key": "main",
            "platformFeePercent": 0,
            "aiProviderPrimary": "groq",
            "aiProviderFallback": "gemini",
            "candidateFreeLimit": 10,
            "employerFreeActiveJobs": 2,
            "featureToggles": {
                "aiResumeParsing": True,
                "aiJobMatching": True,
                "voiceJobPosting": True,
                "payments": True,
                "employerRanking": True,
            },
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

        await db_handler.db["platform_settings"].insert_one(settings)

    return {
        "success": True,
        "settings": serialize_doc(settings),
    }


@admin_router.put("/settings")
async def admin_update_settings(
    payload: dict,
    current_user: dict = Depends(ensure_admin),
):
    payload.pop("_id", None)
    payload.pop("key", None)

    payload["updatedAt"] = datetime.utcnow()
    payload["updatedBy"] = current_user.get("email")

    await db_handler.db["platform_settings"].update_one(
        {"key": "main"},
        {
            "$set": payload,
            "$setOnInsert": {
                "key": "main",
                "createdAt": datetime.utcnow(),
            },
        },
        upsert=True,
    )

    settings = await db_handler.db["platform_settings"].find_one({"key": "main"})

    return {
        "success": True,
        "message": "Settings updated successfully",
        "settings": serialize_doc(settings),
    }
