from datetime import datetime
from src.utils.db_handler import db_handler

prefetch_collection = db_handler.prefetch_queue_collection
result_collection = db_handler.prefetch_results_collection

async def queue_job_prefetch(email: str):
    existing_result = await result_collection.find_one(
        {
            "email": email,
            "status": "completed",
        }
    )
    if existing_result:
        updated_at = existing_result.get("updatedAt")

        if updated_at:
            age_seconds = (datetime.utcnow() - updated_at).total_seconds()

            if age_seconds < 900 and existing_result.get("jobs"):
                return {
                    "success": True,
                    "status": "completed",
                    "message": "Using cached AI recommendations.",
                    "jobsCount": len(existing_result.get("jobs", [])),
                }

    existing_processing = await prefetch_collection.find_one(
        {
            "email": email,
            "status": {
                "$in": ["queued", "processing"],
            },
        }
    )
    if existing_processing:
        return {
            "success": True,
            "status": existing_processing.get("status", "queued"),
            "message": "AI recommendations are already being prepared.",
        }

    await prefetch_collection.insert_one(
        {
            "email": email,
            "status": "queued",
            "attempts": 0,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
    )
    return {
        "success": True,
        "status": "queued",
        "message": "AI recommendation job queued successfully.",
    }


async def get_prefetch_result(email: str):
    result = await result_collection.find_one(
        {
            "email": email,
            "status": "completed",
        }
    )
    if result:
        jobs = result.get("jobs", [])
        return {
            "success": True,
            "status": "completed",
            "jobs": jobs,
            "jobsCount": len(jobs),
            "detected_role": result.get("detected_role", ""),
            "subscription": result.get("subscription", {}),
            "upgradeMessage": result.get("upgradeMessage", ""),
            "updatedAt": result.get("updatedAt"),
        }

    processing = await prefetch_collection.find_one(
        {
            "email": email,
            "status": {
                "$in": ["queued", "processing"],
            },
        }
    )

    if processing:
        return {
            "success": True,
            "status": processing.get("status", "queued"),
            "jobs": [],
            "jobsCount": 0,
            "message": "AI recommendations are being processed.",
        }

    return {
        "success": True,
        "status": "not_found",
        "jobs": [],
        "jobsCount": 0,
        "message": "No AI recommendations found.",
    }

async def clear_prefetch_result(email: str):
    await prefetch_collection.delete_many({"email": email})
    await result_collection.delete_many({"email": email})
    return {
        "success": True,
        "message": "AI recommendation cache cleared successfully.",
    }