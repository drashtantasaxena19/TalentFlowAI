import os
import shutil
import tempfile
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends

from src.ai.jd_parser import parse_jd
from src.middleware.auth_middleware import get_current_user

jd_parser_router = APIRouter(prefix="/api/jd-parser", tags=["JD Parser"])

UPLOAD_FOLDER = tempfile.gettempdir()


@jd_parser_router.post("/upload")
async def upload_jd(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No JD file uploaded")

    if not file.filename.lower().endswith((".pdf", ".docx", ".txt")):
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX, or TXT allowed",
        )

    email = current_user.get("email")
    role = current_user.get("role")

    if not email:
        raise HTTPException(status_code=401, detail="Invalid authenticated user")

    if role not in ["employer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only employers/admins can parse job descriptions",
        )

    original_name = file.filename.replace(" ", "_")
    safe_filename = f"{uuid.uuid4().hex}_{original_name}"
    file_path = os.path.join(UPLOAD_FOLDER, safe_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        parsed = parse_jd(file_path)

        job_data = {
            "title": parsed.get("title", ""),
            "company": parsed.get("company", ""),
            "location": parsed.get("location", ""),
            "jobType": parsed.get("jobType", ""),
            "workMode": parsed.get("workMode", ""),
            "experienceLevel": parsed.get("experienceLevel", ""),
            "experienceYears": parsed.get("experienceYears", 0),
            "salary": parsed.get("salary", ""),
            "currency": parsed.get("currency", ""),

            "skills": parsed.get("skills", []),
            "technicalSkills": parsed.get("technicalSkills", []),
            "softSkills": parsed.get("softSkills", []),
            "tools": parsed.get("tools", []),
            "frameworks": parsed.get("frameworks", []),
            "databases": parsed.get("databases", []),
            "domains": parsed.get("domains", []),

            "responsibilities": parsed.get("responsibilities", []),
            "requirements": parsed.get("requirements", []),
            "qualifications": parsed.get("qualifications", []),
            "benefits": parsed.get("benefits", []),

            "link": parsed.get("link", ""),
            "contactEmail": parsed.get("contactEmail", ""),
            "contactPhone": parsed.get("contactPhone", ""),

            "description": parsed.get("description", ""),
            "summary": parsed.get("summary", ""),
            "jdText": parsed.get("jd_text", ""),
            "source": parsed.get("source", ""),
            "jdFileName": original_name,
            "employerEmail": email,
        }

        return {
            "message": "JD parsed successfully",
            "parsed": parsed,
            "job": job_data,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"JD upload failed: {str(e)}",
        )

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)