import asyncio
from datetime import datetime

from src.utils.db_handler import db_handler
from src.services.recommendation_services import get_user_jobs
from src.services.subscription_service import get_current_subscription

prefetch_collection = db_handler.db["job_prefetch_queue"]
result_collection = db_handler.db["job_prefetch_results"]


async def process_single_job(task: dict):
    email = task.get("email")

    if not email:
        return

    task_id = task["_id"]

    try:
        await prefetch_collection.update_one(
            {"_id": task_id},
            {
                "$set": {
                    "status": "processing",
                    "updatedAt": datetime.utcnow(),
                }
            },
        )

        subscription_response = await get_current_subscription(email)

        if subscription_response.get("success"):
            subscription_data = {
                "currentPlan": subscription_response.get("currentPlan", "free"),
                "subscription": subscription_response.get("subscription", {}),
                "usage": subscription_response.get("usage", {}),
                "features": subscription_response.get("features", {}),
            }
        else:
            subscription_data = {
                "currentPlan": "free",
                "subscription": {},
                "usage": {},
                "features": {},
            }

        recommended_data = await get_user_jobs(email=email)

        jobs = recommended_data.get("jobs", [])
        detected_role = recommended_data.get("detected_role", {})
        upgrade_message = recommended_data.get("upgradeMessage", "")

        await result_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "email": email,
                    "status": "completed",
                    "jobs": jobs,
                    "detected_role": detected_role,
                    "subscription": subscription_data,
                    "upgradeMessage": upgrade_message,
                    "updatedAt": datetime.utcnow(),
                },
                "$setOnInsert": {
                    "createdAt": datetime.utcnow(),
                },
            },
            upsert=True,
        )

        await prefetch_collection.delete_one({"_id": task_id})

        print(f"✅ Prefetch completed for {email} | Jobs: {len(jobs)}")

    except Exception as error:
        await prefetch_collection.update_one(
            {"_id": task_id},
            {
                "$set": {
                    "status": "failed",
                    "error": str(error),
                    "updatedAt": datetime.utcnow(),
                },
                "$inc": {
                    "attempts": 1,
                },
            },
        )

        print(f"❌ Prefetch failed for {email}: {str(error)}")


async def worker_loop():
    print("🚀 TalentFlow Recommendation Worker Started")

    while True:
        try:
            queued_jobs = await prefetch_collection.find(
                {
                    "status": "queued",
                }
            ).sort("createdAt", 1).to_list(5)

            if not queued_jobs:
                await asyncio.sleep(3)
                continue

            for task in queued_jobs:
                await process_single_job(task)

        except Exception as loop_error:
            print(f"❌ Worker loop error: {str(loop_error)}")
            await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(worker_loop())