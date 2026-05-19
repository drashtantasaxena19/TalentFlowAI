import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends

from src.ai.resume_parser import parse_resume
from src.models.user_model import update_candidate_profile
from src.middleware.auth_middleware import get_current_user

resume_router = APIRouter(prefix="/api/resume", tags=["Resume"])

UPLOAD_FOLDER = "uploads/resumes"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@resume_router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    if not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Only PDF or DOCX allowed")

    email = current_user.get("email")
    role = current_user.get("role")

    if not email:
        raise HTTPException(status_code=401, detail="Invalid authenticated user")

    if role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can upload resumes")

    original_name = file.filename.replace(" ", "_")
    safe_filename = f"{uuid.uuid4().hex}_{original_name}"
    file_path = os.path.join(UPLOAD_FOLDER, safe_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        parsed = parse_resume(file_path)

        skills = parsed.get("skills", [])
        skills_text = ", ".join(skills) if isinstance(skills, list) else str(skills or "")

        profile_data = {
            "email": email,
            "fullName": parsed.get("name") or current_user.get("name", ""),
            "phone": parsed.get("phone", ""),
            "location": parsed.get("location", ""),
            "currentRole": parsed.get("role", ""),
            "experience": parsed.get("experience", ""),
            "experienceYears": parsed.get("experienceYears", 0),

            "linkedin": parsed.get("linkedin", ""),
            "github": parsed.get("github", ""),
            "portfolio": parsed.get("portfolio", ""),

            "qualification": parsed.get("qualification", ""),
            "course": parsed.get("course", ""),
            "college": parsed.get("college", ""),
            "university": parsed.get("university", ""),
            "education": parsed.get("education", ""),

            "skills": skills_text,
            "technicalSkills": parsed.get("technicalSkills", []),
            "softSkills": parsed.get("softSkills", []),
            "tools": parsed.get("tools", []),
            "libraries": parsed.get("libraries", []),
            "frameworks": parsed.get("frameworks", []),
            "databases": parsed.get("databases", []),
            "domains": parsed.get("domains", []),

            "projects": parsed.get("projects", []),
            "certifications": parsed.get("certifications", []),
            "achievements": parsed.get("achievements", []),

            "summary": parsed.get("summary")
            or f"AI parsed resume profile for {parsed.get('role', 'candidate')}",

            "resumeText": parsed.get("resume_text", ""),
            "resumeSource": parsed.get("source", ""),
            "resumeFileName": original_name,
        }

        await update_candidate_profile(email, profile_data)

        return {
            "message": "Resume uploaded and candidate profile updated successfully",
            "parsed": parsed,
            "profile": profile_data,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resume upload failed: {str(e)}",
        )

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)