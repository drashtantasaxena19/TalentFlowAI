import os
import hmac
import hashlib
from datetime import datetime
from typing import Optional

import razorpay
from fastapi import HTTPException

from src.utils.db_handler import db_handler
from src.services.subscription_service import upgrade_subscription
from src.models.subscription_model import PLANS, normalize_plan
from src.models.payment_model import build_payment_doc

payments_collection = db_handler.db["payments"]

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")


PLAN_NAMES = {
    "pro": "TalentFlow AI Pro Plan",
    "premium": "TalentFlow AI Premium Plan",
    "employer_pro": "TalentFlow AI Smart Hiring Pro",
    "employer_enterprise": "TalentFlow AI Enterprise Hiring",
}


def get_razorpay_client():
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Razorpay keys are missing in .env",
        )

    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


def normalize_payment_plan(plan: str, role: str):
    plan = normalize_plan(plan, role)

    if plan not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid payment plan")

    price = PLANS[plan].get("price", 0)

    if price in [0, -1]:
        raise HTTPException(
            status_code=400,
            detail="This plan does not require online payment",
        )

    return plan


async def create_subscription_order(email: str, role: str, plan: str):
    plan = normalize_payment_plan(plan, role)

    amount_rupees = int(PLANS[plan]["price"])
    amount_paise = amount_rupees * 100

    client = get_razorpay_client()
    receipt = f"tf_{role}_{plan}_{int(datetime.utcnow().timestamp())}"

    order = client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": receipt,
        "payment_capture": 1,
        "notes": {
            "email": email,
            "role": role,
            "plan": plan,
            "product": "TalentFlow AI",
        },
    })

    payment_doc = build_payment_doc(
        email=email,
        role=role,
        plan=plan,
        amount=amount_rupees,
        amount_paise=amount_paise,
        currency="INR",
        razorpay_order_id=order.get("id"),
        receipt=receipt,
    )

    await payments_collection.insert_one(payment_doc)

    return {
        "success": True,
        "key": RAZORPAY_KEY_ID,
        "order": {
            "id": order.get("id"),
            "amount": order.get("amount"),
            "currency": order.get("currency"),
            "receipt": order.get("receipt"),
        },
        "plan": {
            "name": plan,
            "displayName": PLAN_NAMES.get(plan, PLANS[plan]["name"]),
            "amount": amount_rupees,
        },
    }


def verify_razorpay_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
):
    message = f"{razorpay_order_id}|{razorpay_payment_id}"

    generated_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(generated_signature, razorpay_signature)


async def verify_subscription_payment(
    email: str,
    role: str,
    plan: str,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
):
    plan = normalize_payment_plan(plan, role)

    payment = await payments_collection.find_one({
        "email": email,
        "role": role,
        "plan": plan,
        "razorpay_order_id": razorpay_order_id,
    })

    if not payment:
        raise HTTPException(status_code=404, detail="Payment order not found")

    if payment.get("status") == "paid":
        return {
            "success": True,
            "message": "Payment already verified",
            "currentPlan": plan,
        }

    is_valid = verify_razorpay_signature(
        razorpay_order_id=razorpay_order_id,
        razorpay_payment_id=razorpay_payment_id,
        razorpay_signature=razorpay_signature,
    )

    if not is_valid:
        await payments_collection.update_one(
            {"_id": payment["_id"]},
            {
                "$set": {
                    "status": "failed",
                    "failureReason": "Invalid Razorpay signature",
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
        raise HTTPException(status_code=400, detail="Payment verification failed")

    await payments_collection.update_one(
        {"_id": payment["_id"]},
        {
            "$set": {
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
                "status": "paid",
                "paidAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            }
        },
    )

    subscription_result = await upgrade_subscription(email, plan, role)

    return {
        "success": True,
        "message": "Payment verified and subscription upgraded",
        "paymentId": razorpay_payment_id,
        "currentPlan": subscription_result.get("currentPlan", plan),
        "subscription": subscription_result.get("subscription"),
        "features": subscription_result.get("features"),
    }


async def get_user_payments(email: str, role: str, limit: Optional[int] = 20):
    payments = await payments_collection.find(
        {"email": email, "role": role}
    ).sort("createdAt", -1).to_list(limit)

    for payment in payments:
        payment["_id"] = str(payment["_id"])
        payment["createdAt"] = str(payment.get("createdAt", ""))
        payment["updatedAt"] = str(payment.get("updatedAt", ""))
        payment["paidAt"] = str(payment.get("paidAt", ""))

    return {
        "success": True,
        "count": len(payments),
        "payments": payments,
    }