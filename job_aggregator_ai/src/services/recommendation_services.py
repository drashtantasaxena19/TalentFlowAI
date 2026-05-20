from src.models.user_model import (
    get_user_by_email,
)

from src.ai.matcher import (
    match_jobs,
)

from src.utils.db_handler import (
    db_handler,
)


async def get_user_jobs(
    email: str,
    limit: int | None = None,
):
    user = await get_user_by_email(
        email
    )

    if not user:
        return {
            "success": False,
            "jobs": [],
            "message": "User not found",
        }

    profile = user.get(
        "candidateProfile",
        {}
    )

    if not profile:
        return {
            "success": False,
            "jobs": [],
            "message": "Candidate profile missing",
        }

    user_text = build_candidate_text(
        profile
    )

    if not user_text.strip():
        return {
            "success": False,
            "jobs": [],
            "message": "Candidate profile incomplete",
        }

    cached = await db_handler.get_recommendation_cache(
        email
    )

    if (
        cached and
        cached.get("jobs")
    ):
        cached_jobs = (
            cached.get("jobs", [])
        )

        return {
            "success": True,

            "jobs":
                cached_jobs[:limit]
                if limit
                else cached_jobs,

            "detected_role":
                profile.get(
                    "currentRole",
                    ""
                ),

            "cached": True,
        }

    result = await match_jobs(
        resume_text=user_text,
        limit=limit,
    )

    jobs = result.get(
        "jobs",
        []
    )

    detected_role = result.get(
        "detected_role",
        ""
    )

    await db_handler.save_recommendation_cache(
        email=email,
        jobs=jobs,
    )

    return {
        "success": True,

        "jobs": jobs,

        "detected_role":
            detected_role,

        "cached": False,
    }


def build_candidate_text(
    profile: dict,
):
    skills = profile.get(
        "skills",
        ""
    )

    if isinstance(skills, list):
        skills = " ".join(skills)

    technical_skills = profile.get(
        "technicalSkills",
        []
    )

    if isinstance(
        technical_skills,
        list,
    ):
        technical_skills = " ".join(
            technical_skills
        )

    projects = profile.get(
        "projects",
        []
    )

    if isinstance(projects, list):
        projects = " ".join(
            [
                str(project)
                for project in projects
            ]
        )

    certifications = profile.get(
        "certifications",
        []
    )

    if isinstance(
        certifications,
        list,
    ):
        certifications = " ".join(
            certifications
        )

    return f"""
Role:
{profile.get("currentRole", "")}

Skills:
{skills}

Technical Skills:
{technical_skills}

Experience:
{profile.get("experience", "")}

Education:
{profile.get("education", "")}

Projects:
{projects}

Certifications:
{certifications}

Summary:
{profile.get("summary", "")}

Resume:
{profile.get("resumeText", "")}
"""