from src.ai.scorer import (
    calculate_resume_ats_score,
)

from src.ai.semantic_validator import (
    filter_semantic_skills,
)


def calculate_profile_strength(
    profile,
):
    result = (
        calculate_resume_ats_score(
            profile
        )
    )

    ats_score = result[
        "atsScore"
    ]

    if ats_score >= 85:
        level = "Excellent"

    elif ats_score >= 70:
        level = "Strong"

    elif ats_score >= 55:
        level = "Average"

    else:
        level = "Weak"

    return {
        "level": level,
        "atsScore": ats_score,
        "breakdown": result[
            "scoreBreakdown"
        ],
    }


def generate_profile_insights(
    profile,
):
    strengths = []
    weaknesses = []
    recommendations = []

    skills = profile.get(
        "skills",
        [],
    )

    projects = profile.get(
        "projects",
        [],
    )

    certifications = profile.get(
        "certifications",
        [],
    )

    experience = profile.get(
        "experience",
        "",
    )

    summary = profile.get(
        "summary",
        "",
    )

    role = profile.get(
        "role",
        "",
    )

    semantic_result = (
        filter_semantic_skills(
            role=role,
            skills=skills,
        )
    )

    valid_skills = semantic_result[
        "valid"
    ]

    removed_skills = semantic_result[
        "removed"
    ]

    if len(valid_skills) >= 8:
        strengths.append(
            "Strong technical skill coverage."
        )

    else:
        weaknesses.append(
            "Skill coverage is limited."
        )

        recommendations.append(
            "Add more role-relevant skills."
        )

    if projects:
        strengths.append(
            "Projects improve practical credibility."
        )

    else:
        weaknesses.append(
            "No strong project evidence found."
        )

        recommendations.append(
            "Add practical projects."
        )

    if certifications:
        strengths.append(
            "Certifications strengthen profile quality."
        )

    if experience:
        strengths.append(
            "Experience section detected."
        )

    else:
        weaknesses.append(
            "Experience section is weak or missing."
        )

    if summary and len(summary) > 80:
        strengths.append(
            "Professional summary is well structured."
        )

    else:
        recommendations.append(
            "Improve resume summary section."
        )

    if removed_skills:
        recommendations.append(
            "Some detected skills were removed due to semantic mismatch."
        )

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
        "validatedSkills": valid_skills,
        "removedSkills": removed_skills,
    }