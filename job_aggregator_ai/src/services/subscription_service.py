from src.models.subscription_model import (
    get_plan_by_email,
    set_plan,
    normalize_plan,
    PLANS,
)


async def get_current_subscription(email: str, role: str = "candidate"):
    user_plan = await get_plan_by_email(email, role)

    if not user_plan:
        return {
            "success": False,
            "message": "User not found",
        }

    return {
        "success": True,
        "role": user_plan["role"],
        "currentPlan": user_plan["plan"],
        "subscription": user_plan["subscription"],
        "usage": user_plan["usage"],
        "features": user_plan["features"],
    }


async def upgrade_subscription(email: str, target_plan: str, role: str = "candidate"):
    target_plan = normalize_plan(target_plan, role)

    if target_plan not in PLANS:
        return {
            "success": False,
            "message": "Invalid subscription plan",
        }

    updated = await set_plan(email, target_plan, role)

    return {
        "success": True,
        "message": f"Subscription upgraded to {PLANS[target_plan]['name']}",
        "role": updated["role"],
        "currentPlan": updated["plan"],
        "subscription": updated["subscription"],
        "features": updated["features"],
    }


async def cancel_subscription(email: str, role: str = "candidate"):
    default_plan = "employer_free" if role == "employer" else "free"
    downgraded = await set_plan(email, default_plan, role)

    return {
        "success": True,
        "message": "Subscription downgraded successfully",
        "role": downgraded["role"],
        "currentPlan": downgraded["plan"],
        "subscription": downgraded["subscription"],
        "features": downgraded["features"],
    }


def get_plan_limits(plan: str, role: str = "candidate"):
    plan = normalize_plan(plan, role)
    return PLANS[plan]


def can_access_pro(plan: str, role: str = "candidate"):
    plan = normalize_plan(plan, role)
    if role == "employer":
        return plan in ["employer_pro", "employer_enterprise"]
    return plan in ["pro", "premium"]


def can_access_premium(plan: str, role: str = "candidate"):
    plan = normalize_plan(plan, role)
    if role == "employer":
        return plan == "employer_enterprise"
    return plan == "premium"
