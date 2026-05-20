import json
import re
from typing import Optional

from src.ai.resume_parser import parse_resume
from src.utils.db_handler import db_handler

from src.ai.embeddings import (
    get_embedding,
    get_similarity,
)

from src.ai.role_detector import detect_role
from src.ai.skill_engine import extract_skills

from src.ai.scorer import (
    clamp_score,
    calculate_match_score,
    get_recommendation_label,
)


def safe_json(text: str):
    try:
        return json.loads(text)

    except Exception:
        pass

    try:
        match = re.search(
            r"\{.*\}",
            text,
            re.DOTALL,
        )

        if match:
            return json.loads(
                match.group(0)
            )

    except Exception:
        pass

    return None


def normalize_skill(skill: str) -> str:
    return str(skill or "").strip().lower()


def unique_list(items: list) -> list:
    seen = set()
    output = []

    for item in items:
        text = str(item or "").strip()

        if not text:
            continue

        key = text.lower()

        if key not in seen:
            output.append(text)
            seen.add(key)

    return output


def build_text(job: dict) -> str:
    skills = job.get("skills") or ""

    if isinstance(skills, list):
        skills = " ".join(skills)

    return (
        f"{job.get('title') or ''} "
        f"{job.get('company') or ''} "
        f"{job.get('location') or ''} "
        f"{job.get('experience') or ''} "
        f"{job.get('experienceLevel') or ''} "
        f"{job.get('experienceYears') or ''} "
        f"{skills} "
        f"{job.get('jobType') or job.get('job_type') or ''} "
        f"{job.get('workMode') or job.get('work_mode') or ''} "
        f"{job.get('summary') or ''} "
        f"{(job.get('description') or '')[:1800]}"
    ).strip()


def get_required_skills(job: dict, job_text: str) -> list:
    skills = job.get("skills") or []

    if isinstance(skills, str):
        skills = [
            x.strip()
            for x in skills.split(",")
            if x.strip()
        ]

    skills = unique_list(skills)

    if skills:
        return skills

    return unique_list(
        extract_skills(job_text)
    )


def smart_skill_match(
    user_skills: list,
    required_skills: list,
):
    user_keys = {
        normalize_skill(skill): skill
        for skill in user_skills
    }

    matched = []

    for req in required_skills:
        req_key = normalize_skill(req)

        if not req_key:
            continue

        direct = req_key in user_keys

        partial = any(
            req_key in normalize_skill(user_skill)
            or normalize_skill(user_skill) in req_key
            for user_skill in user_skills
        )

        if direct or partial:
            matched.append(req)

    matched_keys = {
        normalize_skill(skill)
        for skill in matched
    }

    missing = [
        skill
        for skill in required_skills
        if normalize_skill(skill)
        not in matched_keys
    ]

    return (
        unique_list(matched),
        unique_list(missing),
    )


def build_weightage(
    skills: list,
    job_text: str,
    matched: bool = True,
):
    weightage = []

    lower_text = job_text.lower()

    for skill in skills:
        skill_key = normalize_skill(skill)

        if not skill_key:
            continue

        importance = 60

        if skill_key in lower_text[:300]:
            importance += 15

        if lower_text.count(skill_key) >= 2:
            importance += 10

        if matched:
            reason = (
                f"{skill} is found in the candidate profile/resume and matches this job requirement."
            )
        else:
            reason = (
                f"{skill} appears important for this job but is not clearly found in the candidate profile/resume."
            )

        weightage.append({
            "skill": skill,
            "weightage": clamp_score(
                importance
            ),
            "reason": reason,
        })

    return weightage


def extract_candidate_years(parsed: dict):
    value = (
        parsed.get("experienceYears")
        or parsed.get(
            "total_experience_years"
        )
    )

    try:
        return float(value or 0)

    except Exception:
        return 0


def decide_limit(results: list) -> int:
    if not results:
        return 10

    max_score = max(
        float(r.get("score", 0))
        for r in results
    )

    if max_score >= 80:
        return 8

    if max_score >= 60:
        return 12

    return 20


def analyze_job_match(
    parsed: dict,
    user_text: str,
    user_skills: list,
    job: dict,
):
    job_text = build_text(job)

    if not job_text:
        return None

    required_skills = get_required_skills(
        job,
        job_text,
    )

    matched_skills, missing_skills = (
        smart_skill_match(
            user_skills=user_skills,
            required_skills=required_skills,
        )
    )

    user_embedding = get_embedding(
        user_text
    )

    job_embedding = get_embedding(
        job_text
    )

    emb_score = get_similarity(
        user_embedding,
        job_embedding,
    )

    score_result = calculate_match_score(
        embedding_score=emb_score,
        matched_skills=matched_skills,
        required_skills=required_skills,
        job=job,
        candidate_years=extract_candidate_years(
            parsed
        ),
        candidate_profile=parsed,
    )

    score = score_result["score"]

    return {
        "score": score,
        "match_score": score,
        "match": f"{round(score)}%",
        "matchLabel":
            get_recommendation_label(score),

        "required_skills":
            required_skills,

        "matched_skills":
            matched_skills,

        "missing_skills":
            missing_skills,

        "matchedSkillsWeightage":
            build_weightage(
                matched_skills,
                job_text,
                matched=True,
            ),

        "missingSkillsWeightage":
            build_weightage(
                missing_skills,
                job_text,
                matched=False,
            ),

        "scoreBreakdown":
            score_result["breakdown"],

        "reason": (
            "Matched using semantic embedding similarity, "
            "required skill coverage, "
            "experience relevance, and profile quality."
        ),

        "career_advice": (
            "Improve missing skills and add clear "
            "project/work evidence to increase "
            "your TalentFlow match score."
        ),

        "learning":
            missing_skills[:5],

        "analysis_source":
            "semantic-dynamic-scoring",
    }


async def match_jobs(
    resume_path: Optional[str] = None,
    resume_text: Optional[str] = None,
    limit: Optional[int] = None,
):
    if resume_path:
        parsed = parse_resume(
            resume_path
        )

    else:
        parsed = {
            "skills":
                extract_skills(
                    resume_text or ""
                ),

            "resume_text":
                resume_text or "",

            "role":
                detect_role(
                    resume_text or ""
                ),

            "experience": "",

            "summary":
                resume_text or "",
        }

    user_skills = unique_list(
        parsed.get("skills", [])
    )

    user_role = detect_role(
        parsed.get("resume_text", "")
        or resume_text
        or ""
    )

    user_text = (
        f"{parsed.get('role', '')} "
        f"{' '.join(user_skills)} "
        f"{parsed.get('experience', '')} "
        f"{parsed.get('education', '')} "
        f"{parsed.get('summary', '')} "
        f"{parsed.get('resume_text', '')[:3000]}"
    ).strip()

    jobs_cursor = (
        db_handler.collection.find({})
    )

    jobs = await jobs_cursor.to_list(
        length=5000
    )

    if not jobs:
        return {
            "jobs": [],
            "detected_role":
                user_role,
        }

    results = []

    for job in jobs:
        try:
            final_result = analyze_job_match(
                parsed=parsed,
                user_text=user_text,
                user_skills=user_skills,
                job=job,
            )

            if not final_result:
                continue

            score = final_result[
                "score"
            ]

            if score < 35:
                continue

            job_id = str(
                job.get("_id", "")
            )

            results.append({
                **job,
                "_id": job_id,
                "id": job_id,
                "jobId":
                    job_id
                    or job.get(
                        "link",
                        "",
                    ),

                **final_result,
            })

        except Exception as error:
            print(
                "❌ Match Error:",
                str(error),
            )

    results.sort(
        key=lambda item: item.get(
            "score",
            0,
        ),
        reverse=True,
    )

    final_limit = (
        limit
        or decide_limit(results)
    )

    return {
        "jobs":
            results[:final_limit],

        "detected_role":
            user_role,
    }