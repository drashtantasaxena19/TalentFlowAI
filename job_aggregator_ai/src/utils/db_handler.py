import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()


class DBHandler:
    def __init__(self):
        mongo_uri = os.getenv("MONGO_URI")
        db_name = os.getenv("DB_NAME")

        if not mongo_uri or not db_name:
            raise ValueError("🚨 MONGO_URI or DB_NAME missing in .env")

        try:
            self.client = AsyncIOMotorClient(
                mongo_uri,
                tls=True,
                tlsAllowInvalidCertificates=True,
            )

            self.db = self.client[db_name]

            # Main Collections
            self.collection = self.db["jobs"]
            self.saved_jobs_collection = self.db["saved_jobs"]
            self.users_collection = self.db["users"]

            print("✅ MongoDB Connected")

        except Exception as e:
            print(f"❌ MongoDB Connection Error: {e}")
            raise e

    # =========================
    # SAVE SCRAPED JOBS
    # =========================
    async def save_jobs(self, jobs_list: list):
        if not jobs_list:
            print("⚠️ No jobs to save")
            return {
                "inserted": 0,
                "updated": 0,
                "skipped": 0,
            }

        inserted = 0
        updated = 0
        skipped = 0

        print(f"\n📦 Saving {len(jobs_list)} jobs...")

        for job in jobs_list:
            try:
                if not job.get("link"):
                    skipped += 1
                    continue

                job["updated_at"] = datetime.utcnow().isoformat()

                result = await self.collection.update_one(
                    {"link": job["link"]},
                    {"$set": job},
                    upsert=True,
                )

                if result.upserted_id:
                    inserted += 1
                elif result.modified_count > 0:
                    updated += 1
                else:
                    skipped += 1

            except Exception as e:
                print(f"❌ Error saving job: {e}")

        print("===================================")
        print(f"✅ Inserted: {inserted}")
        print(f"♻️ Updated: {updated}")
        print(f"⚠️ Skipped: {skipped}")
        print("===================================\n")

        return {
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
        }


db_handler = DBHandler()