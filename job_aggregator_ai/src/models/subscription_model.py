from datetime import datetime
from src.utils.db_handler import db_handler

collection = db_handler.db["users"]

PLANS = {
    "free": {
        "name": "Free",
        "role": "candidate",
        "price": 0,
        "saved_jobs_limit": 5,
        "ai_analysis_limit": 2,
        "recommended_jobs_limit": 10,
        "priority_recommendations": False,
        "resume_booster": False,
        "career_roadmap": False,
        "interview_insights": False,
    },
    "pro": {
        "name": "Pro",
        "role": "candidate",
        "price": 199,
        "saved_jobs_limit": -1,
        "ai_analysis_limit": 50,
        "recommended_jobs_limit": 100,
        "priority_recommendations": True,
        "resume_booster": True,
        "career_roadmap": False,
        "interview_insights": True,
    },
    "premium": {
        "name": "Premium",
        "role": "candidate",
        "price": 499,
        "saved_jobs_limit": -1,
        "ai_analysis_limit": -1,
        "recommended_jobs_limit": -1,
        "priority_recommendations": True,
        "resume_booster": True,
        "career_roadmap": True,
        "interview_insights": True,
    },

    "employer_free": {
        "name": "Free Hiring",
        "role": "employer",
        "price": 0,
        "active_jobs_limit": 2,
        "ai_candidate_ranking": False,
        "resume_match_score": False,
        "advanced_applicant_filters": False,
        "priority_job_visibility": False,
        "hiring_analytics": False,
        "bulk_shortlisting": False,
    },
    "employer_pro": {
        "name": "Smart Hiring Pro",
        "role": "employer",
        "price": 999,
        "active_jobs_limit": 15,
        "ai_candidate_ranking": True,
        "resume_match_score": True,
        "advanced_applicant_filters": True,
        "priority_job_visibility": True,
        "hiring_analytics": True,
        "bulk_shortlisting": False,
    },
    "employer_enterprise": {
        "name": "Enterprise Hiring",
        "role": "employer",
        "price": -1,
        "active_jobs_limit": -1,
        "ai_candidate_ranking": True,
        "resume_match_score": True,
        "advanced_applicant_filters": True,
        "priority_job_visibility": True,
        "hiring_analytics": True,
        "bulk_shortlisting": True,
    },
}

DEFAULT_PLAN_BY_ROLE = {
    "candidate": "free",
    "employer": "employer_free",
    "admin": "free",
}


def normalize_role(role: str):
    role = str(role or "").lower().strip()
    if role not in ["candidate", "employer", "admin"]:
        return "candidate"
    return role


def normalize_plan(plan: str, role: str = "candidate"):
    role = normalize_role(role)
    plan = str(plan or "").lower().strip()

    if plan in PLANS and PLANS[plan]["role"] == role:
        return plan

    return DEFAULT_PLAN_BY_ROLE.get(role, "free")


def build_subscription(plan: str, role: str = "candidate"):
    normalized_role = normalize_role(role)
    normalized_plan = normalize_plan(plan, normalized_role)

    return {
        "plan": normalized_plan,
        "role": normalized_role,
        "status": "active",
        "start_date": datetime.utcnow(),
        "end_date": None,
        "auto_renew": False,
    }


async def get_plan_by_email(email: str, role: str = "candidate"):
    role = normalize_role(role)

    user = await collection.find_one(
        {"email": email},
        {
            "email": 1,
            "role": 1,
            "subscription": 1,
            "usage": 1,
        },
    )

    if not user:
        return None

    user_role = normalize_role(user.get("role") or role)
    current_plan = normalize_plan(
        user.get("subscription", {}).get("plan"),
        user_role,
    )

    return {
        "email": user["email"],
        "role": user_role,
        "plan": current_plan,
        "subscription": user.get("subscription") or build_subscription(current_plan, user_role),
        "usage": user.get("usage", {}),
        "features": PLANS[current_plan],
    }


async def set_plan(email: str, plan: str, role: str = "candidate"):
    role = normalize_role(role)
    normalized_plan = normalize_plan(plan, role)
    subscription_data = build_subscription(normalized_plan, role)

    await collection.update_one(
        {"email": email},
        {
            "$set": {
                "subscription": subscription_data,
                "updatedAt": datetime.utcnow(),
            }
        },
    )

    return await get_plan_by_email(email, role)


def can_save_more_jobs(subscription_data: dict):
    plan = normalize_plan(subscription_data.get("plan", "free"), "candidate")
    limit = PLANS[plan]["saved_jobs_limit"]

    if limit == -1:
        return True

    used = subscription_data.get("usage", {}).get("saved_jobs_count", 0)
    return used < limit


def get_recommended_jobs_limit(plan: str):
    normalized_plan = normalize_plan(plan, "candidate")
    return PLANS[normalized_plan]["recommended_jobs_limit"]


def get_active_jobs_limit(plan: str):
    normalized_plan = normalize_plan(plan, "employer")
    return PLANS[normalized_plan]["active_jobs_limit"]


def has_feature(plan: str, feature: str, role: str = "candidate"):
    normalized_plan = normalize_plan(plan, role)
    return PLANS[normalized_plan].get(feature, False)