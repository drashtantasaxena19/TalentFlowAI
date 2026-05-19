from datetime import datetime


def build_payment_doc(
    email: str,
    role: str,
    plan: str,
    amount: int,
    amount_paise: int,
    currency: str,
    razorpay_order_id: str,
    receipt: str,
):
    return {
        "email": email,
        "role": role,
        "plan": plan,
        "amount": amount,
        "amount_paise": amount_paise,
        "currency": currency,
        "razorpay_order_id": razorpay_order_id,
        "razorpay_payment_id": None,
        "razorpay_signature": None,
        "status": "created",
        "receipt": receipt,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }