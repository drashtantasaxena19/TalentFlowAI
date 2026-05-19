import asyncio
import os
from datetime import datetime

from dotenv import load_dotenv

from src.utils.db_handler import db_handler
from src.services.auth_service import hash_password

load_dotenv()

users_collection = db_handler.db["users"]


async def seed_admin():
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_name = os.getenv("ADMIN_NAME", "TalentFlow Admin")

    if not admin_email or not admin_password:
        raise ValueError("ADMIN_EMAIL and ADMIN_PASSWORD are required in .env")

    existing_admin = await users_collection.find_one({
        "email": admin_email.lower()
    })

    admin_data = {
        "name": admin_name,
        "email": admin_email.lower(),
        "password": hash_password(admin_password),
        "role": "admin",
        "companyName": "",
        "isActive": True,
        "subscription": {
            "plan": "admin",
            "status": "active",
            "start_date": datetime.utcnow(),
            "end_date": None,
            "auto_renew": False,
        },
        "usage": {},
        "candidateProfile": {},
        "updatedAt": datetime.utcnow(),
    }

    if existing_admin:
        await users_collection.update_one(
            {"email": admin_email.lower()},
            {"$set": admin_data}
        )

        print("✅ Admin account updated successfully")
        print(f"📧 Email: {admin_email}")
        return

    admin_data["createdAt"] = datetime.utcnow()

    await users_collection.insert_one(admin_data)

    print("✅ Admin account created successfully")
    print(f"📧 Email: {admin_email}")


if __name__ == "__main__":
    asyncio.run(seed_admin())