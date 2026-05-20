from fastapi import APIRouter, Depends, HTTPException

from src.middleware.auth_middleware import get_current_user
from src.models.user_model import get_user_by_email
from src.services.groq_service import analyze_candidate_profile

router = APIRouter(
    prefix="/api/profile-analysis",
    tags=["Profile Analysis"],
)


@router.get("/")
async def analyze_profile(
    current_user: dict = Depends(get_current_user),
):
    email = current_user.get("email", "")
    role = current_user.get("role", "")

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid authenticated user",
        )

    if role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can use AI profile analysis",
        )

    user = await get_user_by_email(email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    profile = user.get("candidateProfile", {})

    if not profile:
        raise HTTPException(
            status_code=400,
            detail="Candidate profile not found",
        )

    analysis = await analyze_candidate_profile(profile)

    return {
        "success": True,
        "profileScore": analysis.get("profileScore", 0),
        "atsScore": analysis.get("atsScore", 0),
        "detectedRole": analysis.get("detectedRole", ""),
        "careerLevel": analysis.get("careerLevel", ""),
        "profileCompleteness": analysis.get("profileCompleteness", 0),
        "skillsScore": analysis.get("skillsScore", 0),
        "experienceScore": analysis.get("experienceScore", 0),
        "educationScore": analysis.get("educationScore", 0),
        "projectScore": analysis.get("projectScore", 0),
        "atsReadinessScore": analysis.get("atsReadinessScore", 0),
        "strengths": analysis.get("strengths", []),
        "weaknesses": analysis.get("weaknesses", []),
        "matchedSkills": analysis.get("matchedSkills", []),
        "missingSkills": analysis.get("missingSkills", []),
        "recommendedSkills": analysis.get("recommendedSkills", []),
        "careerSuggestions": analysis.get("careerSuggestions", []),
        "recommendedRoles": analysis.get("recommendedRoles", []),
        "interviewQuestions": analysis.get("interviewQuestions", []),
        "salarySuggestion": analysis.get("salarySuggestion", {}),
        "aiInsights": analysis.get("aiInsights", ""),
        "scoreBreakdown": analysis.get("scoreBreakdown", {}),
        "confidence": analysis.get("confidence", 0),
        "source": analysis.get("source", "profile-analysis"),
    }