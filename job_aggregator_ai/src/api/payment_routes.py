from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.middleware.auth_middleware import get_current_user
from src.services.payment_services import (
    create_subscription_order,
    verify_subscription_payment,
    get_user_payments,
)

router = APIRouter(prefix="/payments", tags=["Payments"])


class CreateOrderRequest(BaseModel):
    plan: str


class VerifyPaymentRequest(BaseModel):
    plan: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/create-order")
async def create_order(
    payload: CreateOrderRequest,
    current_user: dict = Depends(get_current_user),
):
    email = current_user.get("email")
    role = current_user.get("role")

    if not email:
        raise HTTPException(status_code=401, detail="Invalid authenticated user")

    if role not in ["candidate", "employer"]:
        raise HTTPException(
            status_code=403,
            detail="Only candidates and employers can buy subscriptions",
        )

    return await create_subscription_order(
        email=email,
        role=role,
        plan=payload.plan,
    )


@router.post("/verify")
async def verify_payment(
    payload: VerifyPaymentRequest,
    current_user: dict = Depends(get_current_user),
):
    email = current_user.get("email")
    role = current_user.get("role")

    if not email:
        raise HTTPException(status_code=401, detail="Invalid authenticated user")

    if role not in ["candidate", "employer"]:
        raise HTTPException(
            status_code=403,
            detail="Only candidates and employers can verify payments",
        )

    return await verify_subscription_payment(
        email=email,
        role=role,
        plan=payload.plan,
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature,
    )


@router.get("/history")
async def payment_history(current_user: dict = Depends(get_current_user)):
    email = current_user.get("email")
    role = current_user.get("role")

    if not email:
        raise HTTPException(status_code=401, detail="Invalid authenticated user")

    return await get_user_payments(email=email, role=role)