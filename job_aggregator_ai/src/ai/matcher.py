from typing import Optional

from src.ai.resume_parser import parse_resume
from src.utils.db_handler import db_handler

from src.ai.role_detector import detect_role
from src.ai.skill_engine import extract_skills
from src.ai.scorer import calculate_score, clamp_score
from src.ai.ai_engine import ai_match_analysis, USE_AI


# ✅ Lazy-loaded embedding functions
# This prevents torch / sentence-transformers / HF model from loading on app startup.
_get_embedding = None
_get_embeddings = None
_get_similarity = None


def load_embedding_functions():
    global _get_embedding, _get_embeddings, _get_similarity

    if _get_embedding is None or _get_embeddings is None or _get_similarity is None:
        from src.ai.embeddings import (
            get_embedding,
            get_embeddings,
            get_similarity,
        )

        _get_embedding = get_embedding
        _get_embeddings = get_embeddings
        _get_similarity = get_similarity

    return _get_embedding, _get_embeddings, _get_similarity


def normalize_skill(skill: str) -> str:
    return str(skill or "").strip().lower()


def unique_list(items: list) -> list:
    seen = set()
    output = []

    for item in items:
        text = str(item or "").strip()
        key = text.lower()

        if text and key not in seen:
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
        f"{skills} "
        f"{(job.get('description') or '')[:1500]}"
    ).strip()


def decide_limit(results: list) -> int:
    if not results:
        return 10

    max_score = max(float(r.get("score", 0)) for r in results)

    if max_score >= 80:
        return 8

    if max_score >= 60:
        return 12

    return 20


def smart_skill_match(user_skills: list, required_skills: list, job_text: str):
    user_skill_map = {normalize_skill(skill): skill for skill in user_skills}
    matched = []

    for req in required_skills:
        req_key = normalize_skill(req)

        if not req_key:
            continue

        direct_match = req_key in user_skill_map

        partial_match = any(
            req_key in normalize_skill(user_skill)
            or normalize_skill(user_skill) in req_key
            for user_skill in user_skills
        )

        text_match = (
            req_key in job_text.lower()
            and req_key in " ".join(user_skill_map.keys())
        )

        if direct_match or partial_match or text_match:
            matched.append(req)

    missing = [
        skill
        for skill in required_skills
        if normalize_skill(skill) not in [normalize_skill(x) for x in matched]
    ]

    return unique_list(matched), unique_list(missing)


def build_weightage(skills: list, job_text: str, matched: bool = True) -> list:
    weightage = []

    for skill in skills:
        skill_key = normalize_skill(skill)

        if not skill_key:
            continue

        importance = 65

        title_boost = skill_key in job_text[:250].lower()
        repeated_boost = job_text.lower().count(skill_key) >= 2

        if title_boost:
            importance += 15

        if repeated_boost:
            importance += 10

        if matched:
            reason = (
                f"{skill} is present in candidate profile/resume "
                "and relevant to this job."
            )
        else:
            reason = (
                f"{skill} appears important for this job but is not clearly "
                "found in candidate profile/resume."
            )

        weightage.append(
            {
                "skill": skill,
                "weightage": clamp_score(importance),
                "reason": reason,
            }
        )

    return weightage


def fallback_match(user_text: str, user_skills: list, job_text: str, emb_score: float):
    required_skills = extract_skills(job_text)
    required_skills = unique_list(required_skills)

    matched_skills, missing_skills = smart_skill_match(
        user_skills=user_skills,
        required_skills=required_skills,
        job_text=job_text,
    )

    embedding_percentage = clamp_score(emb_score * 100)

    if required_skills:
        skill_score = (len(matched_skills) / len(required_skills)) * 100
    else:
        skill_score = embedding_percentage

    final_match_score = clamp_score(
        embedding_percentage * 0.55 + skill_score * 0.45
    )

    return {
        "is_fit": final_match_score >= 55,
        "match_score": final_match_score,
        "required_skills": required_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "matchedSkillsWeightage": build_weightage(
            matched_skills, job_text, matched=True
        ),
        "missingSkillsWeightage": build_weightage(
            missing_skills, job_text, matched=False
        ),
        "reason": (
            "Matched using semantic embedding similarity and skill overlap fallback. "
            "AI provider was unavailable or skipped for this job."
        ),
        "learning_suggestions": missing_skills[:5],
        "career_advice": (
            "Improve the missing skills and add project evidence in your resume "
            "to increase job match score."
        ),
        "source": "fallback",
    }


def normalize_ai_result(
    ai_result: dict,
    user_skills: list,
    job_text: str,
    emb_score: float,
):
    if not ai_result:
        return fallback_match("", user_skills, job_text, emb_score)

    required_skills = unique_list(
        ai_result.get("required_skills", []) or extract_skills(job_text)
    )

    matched_skills = unique_list(ai_result.get("matched_skills", []))
    missing_skills = unique_list(ai_result.get("missing_skills", []))

    if not matched_skills and required_skills:
        matched_skills, missing_skills = smart_skill_match(
            user_skills=user_skills,
            required_skills=required_skills,
            job_text=job_text,
        )

    match_score = ai_result.get("match_score")

    if match_score is None:
        match_score = calculate_score(emb_score, None)

    return {
        "is_fit": bool(ai_result.get("is_fit", clamp_score(match_score) >= 55)),
        "match_score": clamp_score(match_score),
        "required_skills": required_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "matchedSkillsWeightage": (
            ai_result.get("matchedSkillsWeightage")
            or ai_result.get("matched_skills_weightage")
            or build_weightage(matched_skills, job_text, matched=True)
        ),
        "missingSkillsWeightage": (
            ai_result.get("missingSkillsWeightage")
            or ai_result.get("missing_skills_weightage")
            or build_weightage(missing_skills, job_text, matched=False)
        ),
        "reason": ai_result.get("reason", ""),
        "learning_suggestions": ai_result.get(
            "learning_suggestions", missing_skills[:5]
        ),
        "career_advice": ai_result.get(
            "career_advice",
            "Focus on missing high-priority skills to improve your match.",
        ),
        "source": ai_result.get("source", "AI"),
    }


async def match_jobs(
    resume_path: Optional[str] = None,
    resume_text: Optional[str] = None,
    limit: Optional[int] = None,
):
    if resume_path:
        parsed = parse_resume(resume_path)
        user_text = parsed.get("resume_text", "")
        user_skills = parsed.get("skills", [])

    elif resume_text:
        user_text = resume_text
        user_skills = extract_skills(resume_text)

    else:
        return {
            "detected_role": {},
            "ai_enabled": USE_AI,
            "total_jobs": 0,
            "jobs": [],
        }

    user_text = str(user_text or "").strip()
    user_skills = unique_list(user_skills)

    if not user_text:
        return {
            "detected_role": {},
            "ai_enabled": USE_AI,
            "total_jobs": 0,
            "jobs": [],
        }

    role = detect_role(user_text)

    jobs = await db_handler.collection.find({}).to_list(500)

    if not jobs:
        return {
            "detected_role": role,
            "ai_enabled": USE_AI,
            "total_jobs": 0,
            "jobs": [],
        }

    job_texts = [build_text(job) for job in jobs]

    # ✅ Load heavy embedding model only when matching is actually called.
    get_embedding, get_embeddings, get_similarity = load_embedding_functions()

    user_emb = get_embedding(user_text)
    job_embs = get_embeddings(job_texts)
    scores = get_similarity(user_emb, job_embs)

    temp_results = []

    for i, job in enumerate(jobs):
        temp_results.append(
            {
                "job": job,
                "job_text": job_texts[i],
                "embedding_score": float(scores[i]),
            }
        )

    temp_results.sort(key=lambda x: x["embedding_score"], reverse=True)

    results = []

    for index, item in enumerate(temp_results):
        job = item["job"]
        job_text = item["job_text"]
        emb_score = item["embedding_score"]

        ai_result = None

        if USE_AI and index < 2:
            ai_result = ai_match_analysis(user_text, job_text)

        if ai_result:
            ai_result = normalize_ai_result(
                ai_result,
                user_skills,
                job_text,
                emb_score,
            )
        else:
            ai_result = fallback_match(
                user_text,
                user_skills,
                job_text,
                emb_score,
            )

        final_score = calculate_score(emb_score, ai_result)

        results.append(
            {
                "title": job.get("title", ""),
                "company": job.get("company", ""),
                "location": job.get("location", ""),
                "salary": job.get("salary", ""),
                "experience": job.get("experience", ""),
                "description": job.get("description", ""),
                "link": job.get("link", ""),
                "source": job.get("source", ""),
                "score": final_score,
                "embedding_score": round(emb_score, 3),
                "fit": ai_result.get("is_fit", False),
                "required_skills": ai_result.get("required_skills", []),
                "matched_skills": ai_result.get("matched_skills", []),
                "missing_skills": ai_result.get("missing_skills", []),
                "matchedSkillsWeightage": ai_result.get(
                    "matchedSkillsWeightage", []
                ),
                "missingSkillsWeightage": ai_result.get(
                    "missingSkillsWeightage", []
                ),
                "reason": ai_result.get("reason", ""),
                "learning": ai_result.get("learning_suggestions", []),
                "career_advice": ai_result.get("career_advice", ""),
                "analysis_source": ai_result.get("source", "AI"),
            }
        )

    results.sort(key=lambda x: x["score"], reverse=True)

    if limit is None:
        limit = decide_limit(results)

    limit = min(int(limit), 50)

    return {
        "detected_role": role,
        "ai_enabled": USE_AI,
        "total_jobs": len(results[:limit]),
        "jobs": results[:limit],
    }