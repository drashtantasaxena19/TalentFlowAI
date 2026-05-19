from datetime import datetime
from src.utils.db_handler import db_handler

collection = db_handler.db["users"]


# =========================
# DEFAULT SUBSCRIPTION
# =========================
def default_subscription():
    return {
        "plan": "free",  # free | pro | premium
        "status": "active",
        "start_date": datetime.utcnow(),
        "end_date": None,
        "auto_renew": False,
    }


# =========================
# DEFAULT USAGE LIMITS
# =========================
def default_usage():
    return {
        "saved_jobs_count": 0,
        "monthly_ai_analysis_count": 0,
        "recommended_jobs_used": 0,
    }


# =========================
# CREATE USER
# =========================
async def create_user(user_data: dict):
    existing_user = await collection.find_one({"email": user_data["email"]})

    if existing_user:
        return None

    # Production-first default SaaS fields
    user_data["subscription"] = user_data.get(
        "subscription",
        default_subscription()
    )

    user_data["usage"] = user_data.get(
        "usage",
        default_usage()
    )

    user_data["candidateProfile"] = user_data.get(
        "candidateProfile",
        {}
    )

    user_data["createdAt"] = user_data.get(
        "createdAt",
        datetime.utcnow()
    )

    user_data["updatedAt"] = datetime.utcnow()

    await collection.insert_one(user_data)

    return user_data


# =========================
# GET USER BY EMAIL
# =========================
async def get_user_by_email(email: str):
    return await collection.find_one({"email": email})


# =========================
# SAVE FULL USER PROFILE
# =========================
async def save_user_profile(user_data: dict):
    user_data["updatedAt"] = datetime.utcnow()

    await collection.update_one(
        {"email": user_data["email"]},
        {"$set": user_data},
        upsert=True
    )


# =========================
# GET FULL USER PROFILE
# =========================
async def get_user_profile(email: str):
    return await collection.find_one({"email": email})


# =========================
# UPDATE CANDIDATE PROFILE
# =========================
async def update_candidate_profile(email: str, profile_data: dict):
    await collection.update_one(
        {"email": email},
        {
            "$set": {
                "candidateProfile": profile_data,
                "updatedAt": datetime.utcnow(),
            }
        },
        upsert=False
    )

    return await collection.find_one({"email": email})


# =========================
# SUBSCRIPTION HELPERS
# =========================
async def get_user_subscription(email: str):
    user = await collection.find_one(
        {"email": email},
        {"subscription": 1, "usage": 1, "email": 1}
    )

    if not user:
        return None

    if "subscription" not in user:
        await collection.update_one(
            {"email": email},
            {
                "$set": {
                    "subscription": default_subscription(),
                    "usage": default_usage(),
                }
            }
        )

        user = await collection.find_one(
            {"email": email},
            {"subscription": 1, "usage": 1, "email": 1}
        )

    return user


async def update_user_subscription(email: str, subscription_data: dict):
    subscription_data["updatedAt"] = datetime.utcnow()

    await collection.update_one(
        {"email": email},
        {
            "$set": {
                "subscription": subscription_data,
                "updatedAt": datetime.utcnow(),
            }
        }
    )

    return await collection.find_one({"email": email})


# =========================
# USAGE TRACKING
# =========================
async def increment_saved_jobs_usage(email: str):
    await collection.update_one(
        {"email": email},
        {
            "$inc": {
                "usage.saved_jobs_count": 1
            },
            "$set": {
                "updatedAt": datetime.utcnow()
            }
        }
    )


async def decrement_saved_jobs_usage(email: str):
    user = await collection.find_one({"email": email})

    current_count = user.get("usage", {}).get("saved_jobs_count", 0)

    new_count = max(0, current_count - 1)

    await collection.update_one(
        {"email": email},
        {
            "$set": {
                "usage.saved_jobs_count": new_count,
                "updatedAt": datetime.utcnow(),
            }
        }
    )


async def increment_recommended_jobs_usage(email: str, count: int):
    await collection.update_one(
        {"email": email},
        {
            "$inc": {
                "usage.recommended_jobs_used": count
            },
            "$set": {
                "updatedAt": datetime.utcnow()
            }
        }
    )