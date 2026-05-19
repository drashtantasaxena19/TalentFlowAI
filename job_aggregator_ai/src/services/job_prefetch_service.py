from datetime import datetime
from src.utils.db_handler import db_handler

prefetch_collection = db_handler.db["job_prefetch_queue"]
result_collection = db_handler.db["job_prefetch_results"]


async def queue_job_prefetch(email: str):
    failed = await prefetch_collection.find_one({
        "email": email,
        "status": "failed",
    })

    if failed:
        await prefetch_collection.delete_many({"email": email})

    existing = await prefetch_collection.find_one({
        "email": email,
        "status": {"$in": ["queued", "processing"]},
    })

    if existing:
        return {
            "success": True,
            "status": existing.get("status", "queued"),
            "message": "Job recommendation prefetch already queued",
        }

    cached_result = await result_collection.find_one({
        "email": email,
        "status": "completed",
    })

    if cached_result:
        return {
            "success": True,
            "status": "completed",
            "message": "Recommended jobs already cached",
        }

    await prefetch_collection.insert_one({
        "email": email,
        "status": "queued",
        "attempts": 0,
        "error": "",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    })

    return {
        "success": True,
        "status": "queued",
        "message": "Job recommendation prefetch queued",
    }


async def get_prefetch_result(email: str):
    result = await result_collection.find_one({
        "email": email,
        "status": "completed",
    })

    if result:
        result["_id"] = str(result["_id"])

        return {
            "success": True,
            "status": "completed",
            "jobs": result.get("jobs", []),
            "detected_role": result.get("detected_role", {}),
            "subscription": result.get("subscription", {}),
            "upgradeMessage": result.get("upgradeMessage", ""),
            "createdAt": str(result.get("createdAt", "")),
            "updatedAt": str(result.get("updatedAt", "")),
        }

    queued = await prefetch_collection.find_one({
        "email": email,
        "status": {"$in": ["queued", "processing"]},
    })

    if queued:
        return {
            "success": True,
            "status": queued.get("status", "queued"),
            "jobs": [],
            "message": "AI job matching is preparing recommendations",
        }

    failed = await prefetch_collection.find_one({
        "email": email,
        "status": "failed",
    })

    if failed:
        return {
            "success": False,
            "status": "failed",
            "jobs": [],
            "message": "AI job matching failed",
            "error": failed.get("error", ""),
        }

    return {
        "success": True,
        "status": "not_started",
        "jobs": [],
        "message": "Job recommendation prefetch not started",
    }


async def clear_prefetch_result(email: str):
    await prefetch_collection.delete_many({"email": email})
    await result_collection.delete_many({"email": email})

    return {
        "success": True,
        "message": "Prefetch cache cleared",
    }