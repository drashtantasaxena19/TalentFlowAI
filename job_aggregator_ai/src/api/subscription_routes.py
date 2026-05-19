from fastapi import APIRouter, Depends
from pydantic import BaseModel

from src.middleware.auth_middleware import get_current_user
from src.services.subscription_service import (
    get_current_subscription,
    upgrade_subscription,
    cancel_subscription,
)

router = APIRouter(prefix="/subscription", tags=["Subscription"])


class UpgradeSubscriptionRequest(BaseModel):
    plan: str


@router.get("/current")
async def current_subscription(current_user: dict = Depends(get_current_user)):
    return await get_current_subscription(
        email=current_user.get("email"),
        role=current_user.get("role", "candidate"),
    )


@router.post("/upgrade")
async def upgrade_user_subscription(
    payload: UpgradeSubscriptionRequest,
    current_user: dict = Depends(get_current_user),
):
    return await upgrade_subscription(
        email=current_user.get("email"),
        target_plan=payload.plan,
        role=current_user.get("role", "candidate"),
    )


@router.post("/cancel")
async def cancel_user_subscription(current_user: dict = Depends(get_current_user)):
    return await cancel_subscription(
        email=current_user.get("email"),
        role=current_user.get("role", "candidate"),
    )