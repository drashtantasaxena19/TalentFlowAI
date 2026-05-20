import os


def clamp_score(value):
    try:
        value = float(value)
    except Exception:
        value = 0

    return round(
        max(0, min(100, value)),
        1,
    )


def normalize_weights(weights: dict):
    total = sum(weights.values())

    if total <= 0:
        return weights

    return {
        key: value / total
        for key, value in weights.items()
    }


def default_weights():
    return normalize_weights({
        "semantic": float(
            os.getenv(
                "MATCH_SEMANTIC_WEIGHT",
                "0.40",
            )
        ),
        "skills": float(
            os.getenv(
                "MATCH_SKILLS_WEIGHT",
                "0.35",
            )
        ),
        "experience": float(
            os.getenv(
                "MATCH_EXPERIENCE_WEIGHT",
                "0.15",
            )
        ),
        "education": float(
            os.getenv(
                "MATCH_EDUCATION_WEIGHT",
                "0.05",
            )
        ),
        "profileQuality": float(
            os.getenv(
                "MATCH_PROFILE_QUALITY_WEIGHT",
                "0.05",
            )
        ),
    })


def calculate_semantic_score(
    embedding_score,
):
    return clamp_score(
        embedding_score * 100
    )


def calculate_skill_match_score(
    matched_skills,
    required_skills,
):
    required_count = max(
        len(required_skills),
        1,
    )

    matched_count = len(
        matched_skills
    )

    return clamp_score(
        (matched_count / required_count)
        * 100
    )


def calculate_experience_score(
    candidate_years,
    required_years,
):
    try:
        candidate_years = float(
            candidate_years or 0
        )
    except Exception:
        candidate_years = 0

    try:
        required_years = float(
            required_years or 0
        )
    except Exception:
        required_years = 0

    if required_years <= 0:
        return 70

    if candidate_years >= required_years:
        return 100

    gap = (
        required_years
        - candidate_years
    )

    if gap <= 1:
        return 75

    if gap <= 2:
        return 55

    return 30


def calculate_education_score(
    candidate_profile,
):
    education = str(
        candidate_profile.get(
            "education",
            "",
        )
    ).strip()

    if not education:
        return 30

    text = education.lower()

    if any(
        word in text
        for word in [
            "phd",
            "doctorate",
            "mtech",
            "mba",
            "master",
        ]
    ):
        return 100

    if any(
        word in text
        for word in [
            "btech",
            "bachelor",
            "bca",
            "bsc",
            "be ",
        ]
    ):
        return 85

    if any(
        word in text
        for word in [
            "diploma",
            "polytechnic",
        ]
    ):
        return 70

    return 55


def calculate_profile_quality_score(
    candidate_profile,
):
    score = 0

    if candidate_profile.get(
        "summary"
    ):
        score += 15

    if candidate_profile.get(
        "skills"
    ):
        score += 25

    if candidate_profile.get(
        "projects"
    ):
        score += 20

    if candidate_profile.get(
        "experience"
    ):
        score += 20

    if candidate_profile.get(
        "education"
    ):
        score += 10

    if candidate_profile.get(
        "certifications"
    ):
        score += 10

    return clamp_score(score)


def calculate_resume_ats_score(
    profile: dict,
):
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

    education = profile.get(
        "education",
        "",
    )

    experience = profile.get(
        "experience",
        "",
    )

    summary = profile.get(
        "summary",
        "",
    )

    resume_text = profile.get(
        "resume_text",
        "",
    )

    skills_score = 0

    if skills:
        if len(skills) >= 12:
            skills_score = 100
        elif len(skills) >= 8:
            skills_score = 85
        elif len(skills) >= 5:
            skills_score = 70
        elif len(skills) >= 3:
            skills_score = 55
        else:
            skills_score = 35

    experience_score = 0

    if experience:
        experience_score = 70

        exp_text = str(
            experience
        ).lower()

        if any(
            word in exp_text
            for word in [
                "intern",
                "developed",
                "managed",
                "built",
                "designed",
                "handled",
                "worked",
            ]
        ):
            experience_score += 15

        if any(
            char.isdigit()
            for char in exp_text
        ):
            experience_score += 15

    education_score = (
        calculate_education_score(
            profile
        )
    )

    project_score = 0

    if projects:
        if len(projects) >= 3:
            project_score = 100
        elif len(projects) == 2:
            project_score = 80
        else:
            project_score = 60

    certification_score = (
        75
        if certifications
        else 35
    )

    summary_score = (
        80
        if summary
        and len(
            str(summary)
        ) > 80
        else 40
    )

    ats_format_score = 50

    text = f"""
    {summary}
    {experience}
    {resume_text}
    """.lower()

    if "skills" in text:
        ats_format_score += 10

    if "experience" in text:
        ats_format_score += 10

    if "education" in text:
        ats_format_score += 10

    if "project" in text:
        ats_format_score += 10

    if (
        "certification" in text
        or "certificate" in text
    ):
        ats_format_score += 10

    final_score = (
        skills_score * 0.25
        + experience_score * 0.20
        + education_score * 0.10
        + project_score * 0.15
        + certification_score * 0.10
        + summary_score * 0.10
        + ats_format_score * 0.10
    )

    return {
        "atsScore": clamp_score(
            final_score
        ),
        "scoreBreakdown": {
            "skills": clamp_score(
                skills_score
            ),
            "experience": clamp_score(
                experience_score
            ),
            "education": clamp_score(
                education_score
            ),
            "projects": clamp_score(
                project_score
            ),
            "certifications": clamp_score(
                certification_score
            ),
            "summary": clamp_score(
                summary_score
            ),
            "atsFormat": clamp_score(
                ats_format_score
            ),
        },
    }


def calculate_match_score(
    embedding_score,
    matched_skills,
    required_skills,
    job,
    candidate_years,
    candidate_profile,
):
    weights = default_weights()

    semantic_score = (
        calculate_semantic_score(
            embedding_score
        )
    )

    skill_score = (
        calculate_skill_match_score(
            matched_skills,
            required_skills,
        )
    )

    experience_score = (
        calculate_experience_score(
            candidate_years,
            job.get(
                "experienceYears",
                0,
            ),
        )
    )

    education_score = (
        calculate_education_score(
            candidate_profile
        )
    )

    profile_quality_score = (
        calculate_profile_quality_score(
            candidate_profile
        )
    )

    final_score = (
        semantic_score
        * weights["semantic"]
        + skill_score
        * weights["skills"]
        + experience_score
        * weights["experience"]
        + education_score
        * weights["education"]
        + profile_quality_score
        * weights["profileQuality"]
    )

    return {
        "score": clamp_score(
            final_score
        ),
        "breakdown": {
            "semantic": clamp_score(
                semantic_score
            ),
            "skills": clamp_score(
                skill_score
            ),
            "experience": clamp_score(
                experience_score
            ),
            "education": clamp_score(
                education_score
            ),
            "profileQuality": clamp_score(
                profile_quality_score
            ),
        },
    }


def get_recommendation_label(
    score,
):
    score = float(score)

    if score >= 85:
        return (
            "Strong Match"
        )

    if score >= 70:
        return (
            "Good Match"
        )

    if score >= 55:
        return (
            "Potential Match"
        )

    if score >= 40:
        return (
            "Partial Match"
        )

    return "Weak Match"