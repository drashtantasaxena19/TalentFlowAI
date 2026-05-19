from typing import Optional

from fastapi import APIRouter, HTTPException, Depends

from src.middleware.auth_middleware import get_current_user
from src.services.recommendation_services import get_user_jobs
from src.models.user_model import get_user_subscription

router = APIRouter(prefix="/api", tags=["Jobs"])


def get_plan_job_limit(plan: str):
    limits = {
        "free": 10,
        "pro": 100,
        "premium": None,
    }

    return limits.get(plan, 10)


@router.get("/jobs/")
async def get_jobs(
    limit: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    email = current_user.get("email")
    role = current_user.get("role")

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid authenticated user"
        )

    if role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can view recommended jobs"
        )

    subscription_data = await get_user_subscription(email)

    if not subscription_data:
        raise HTTPException(
            status_code=404,
            detail="User subscription not found"
        )

    current_plan = (
        subscription_data.get("subscription", {})
        .get("plan", "free")
        .lower()
    )

    plan_limit = get_plan_job_limit(current_plan)

    final_limit = limit

    if plan_limit is not None:
        if final_limit is None:
            final_limit = plan_limit
        else:
            final_limit = min(final_limit, plan_limit)

    result = await get_user_jobs(
        email=email,
        limit=final_limit,
    )

    result["subscription"] = {
        "plan": current_plan,
        "limit": plan_limit,
    }

    if current_plan == "free":
        result["upgradeMessage"] = (
            "Free plan limited to 10 recommendations. Upgrade to Pro for advanced AI matching."
        )

    return result