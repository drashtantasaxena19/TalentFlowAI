from passlib.context import CryptContext
from datetime import datetime
from src.ai.resume_parser import parse_resume
from src.models.user_model import save_user_profile

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password[:72])


async def create_user_profile(email: str, password: str, file_path: str):

    parsed = parse_resume(file_path)

    user_data = {
        "email": email,
        "password": hash_password(password),

        "skills": parsed.get("skills", []),
        "resume_text": parsed.get("resume_text", ""),


        "name": parsed.get("name", ""),
        "phone": parsed.get("phone", ""),
        "education": parsed.get("education", ""),
        "experience": parsed.get("experience", ""),

        "preferred_roles": [],
        "preferred_location": [],

        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    await save_user_profile(user_data)

    return user_data