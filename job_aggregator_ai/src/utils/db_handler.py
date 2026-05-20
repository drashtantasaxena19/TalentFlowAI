import os
from datetime import datetime

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()


class DBHandler:
    def __init__(self):
        mongo_uri = os.getenv("MONGO_URI")
        db_name = os.getenv("DB_NAME")

        if not mongo_uri or not db_name:
            raise ValueError(
                "MONGO_URI or DB_NAME missing in .env"
            )

        self.client = AsyncIOMotorClient(
            mongo_uri,
            tls=True,
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            maxPoolSize=50,
        )

        self.db = self.client[db_name]

        self.collection = self.db["jobs"]

        self.saved_jobs_collection = self.db["saved_jobs"]

        self.users_collection = self.db["users"]

        self.job_embeddings_collection = self.db[
            "job_embeddings"
        ]

        self.recommendation_cache_collection = self.db[
            "recommendation_cache"
        ]

        self.applications_collection = self.db[
            "applications"
        ]

        self.prefetch_queue_collection = self.db[
            "job_prefetch_queue"
        ]

        self.prefetch_results_collection = self.db[
            "job_prefetch_results"
        ]

        print("✅ MongoDB Connected")

    async def save_jobs(self, jobs_list: list):
        if not jobs_list:
            return {
                "inserted": 0,
                "updated": 0,
                "skipped": 0,
            }

        inserted = 0
        updated = 0
        skipped = 0

        for job in jobs_list:
            try:
                if not job.get("link"):
                    skipped += 1
                    continue

                job["updated_at"] = (
                    datetime.utcnow().isoformat()
                )

                if "created_at" not in job:
                    job["created_at"] = (
                        datetime.utcnow().isoformat()
                    )

                result = await self.collection.update_one(
                    {
                        "link": job["link"]
                    },
                    {
                        "$set": job
                    },
                    upsert=True,
                )

                if result.upserted_id:
                    inserted += 1

                elif result.modified_count > 0:
                    updated += 1

                else:
                    skipped += 1

            except Exception as error:
                skipped += 1

                print(
                    "❌ DB Save Error:",
                    str(error)
                )

        print(
            f"📦 Jobs Synced | "
            f"Inserted={inserted} | "
            f"Updated={updated} | "
            f"Skipped={skipped}"
        )

        return {
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
        }

    async def get_job_by_link(self, link: str):
        return await self.collection.find_one(
            {"link": link}
        )

    async def save_job_embedding(
        self,
        job_link: str,
        embedding: list,
    ):
        try:
            await self.job_embeddings_collection.update_one(
                {
                    "job_link": job_link
                },
                {
                    "$set": {
                        "job_link": job_link,
                        "embedding": embedding,
                        "updatedAt": datetime.utcnow(),
                    }
                },
                upsert=True,
            )

        except Exception as error:
            print(
                "❌ Embedding Save Error:",
                str(error)
            )

    async def get_job_embedding(
        self,
        job_link: str,
    ):
        return await self.job_embeddings_collection.find_one(
            {
                "job_link": job_link
            }
        )

    async def save_recommendation_cache(
        self,
        email: str,
        jobs: list,
    ):
        try:
            await self.recommendation_cache_collection.update_one(
                {
                    "email": email
                },
                {
                    "$set": {
                        "email": email,
                        "jobs": jobs,
                        "updatedAt": datetime.utcnow(),
                    },

                    "$setOnInsert": {
                        "createdAt": datetime.utcnow(),
                    },
                },
                upsert=True,
            )

        except Exception as error:
            print(
                "❌ Recommendation Cache Error:",
                str(error)
            )

    async def get_recommendation_cache(
        self,
        email: str,
    ):
        return await self.recommendation_cache_collection.find_one(
            {
                "email": email
            }
        )


db_handler = DBHandler()