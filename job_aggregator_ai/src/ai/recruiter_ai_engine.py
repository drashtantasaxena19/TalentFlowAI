import json
import os
from typing import Dict, Any, List

from dotenv import load_dotenv

from src.ai.ai_resume_parser import parse_resume_ai
from src.ai.ai_jd_parser import parse_jd_ai

from src.ai.embeddings import (
    get_embedding,
    get_similarity,
)

from src.ai.skill_engine import extract_skills

from src.ai.scorer import (
    clamp_score,
    calculate_skill_match_score,
    calculate_profile_quality_score,
)

from src.ai.matcher import safe_json

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")


def normalize_skill(skill: str) -> str:
    return str(skill or "").strip().lower()


def unique_list(items: List[str]) -> List[str]:
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


def ensure_dict(value: Any) -> Dict[str, Any]:
    if isinstance(value, dict):
        return value

    return {}


def ensure_list(value: Any) -> List[str]:
    if value is None:
        return []

    if isinstance(value, list):
        return unique_list(value)

    if isinstance(value, str):
        return unique_list(
            [
                item.strip()
                for item in value.replace("|", ",").split(",")
                if item.strip()
            ]
        )

    return unique_list([str(value)])


def build_text(data: dict) -> str:
    skills = ensure_list(data.get("skills"))
    technical_skills = ensure_list(data.get("technicalSkills"))
    soft_skills = ensure_list(data.get("softSkills"))
    tools = ensure_list(data.get("tools"))
    domains = ensure_list(data.get("domains"))
    projects = data.get("projects") or []
    responsibilities = data.get("responsibilities") or []
    requirements = data.get("requirements") or []

    return (
        f"{data.get('title', '')} "
        f"{data.get('role', '')} "
        f"{data.get('jobCategory', '')} "
        f"{data.get('summary', '')} "
        f"{data.get('description', '')} "
        f"{data.get('experience', '')} "
        f"{data.get('experienceYears', '')} "
        f"{data.get('location', '')} "
        f"{data.get('jobType', '')} "
        f"{data.get('workMode', '')} "
        f"{data.get('salary', '')} "
        f"{data.get('noticePeriod', '')} "
        f"{' '.join(skills)} "
        f"{' '.join(technical_skills)} "
        f"{' '.join(soft_skills)} "
        f"{' '.join(tools)} "
        f"{' '.join(domains)} "
        f"{json.dumps(projects, ensure_ascii=False)[:3000]} "
        f"{json.dumps(responsibilities, ensure_ascii=False)[:3000]} "
        f"{json.dumps(requirements, ensure_ascii=False)[:3000]}"
    ).strip()


def semantic_skill_match(candidate_skills: list, required_skills: list):
    matched = []
    missing = []

    candidate_skills = ensure_list(candidate_skills)
    required_skills = ensure_list(required_skills)

    candidate_map = {
        normalize_skill(skill): skill
        for skill in candidate_skills
        if normalize_skill(skill)
    }

    for skill in required_skills:
        key = normalize_skill(skill)

        if not key:
            continue

        direct_match = key in candidate_map

        partial_match = any(
            key in normalize_skill(candidate_skill)
            or normalize_skill(candidate_skill) in key
            for candidate_skill in candidate_skills
        )

        if direct_match or partial_match:
            matched.append(skill)
        else:
            missing.append(skill)

    return unique_list(matched), unique_list(missing)


def build_ai_prompt(
    parsed_resume: dict,
    parsed_jd: dict,
    semantic_score: float,
    skills_score: float,
    matched_skills: list,
    missing_skills: list,
    profile_quality_score: float,
):
    return f"""
You are TalentFlow AI, an enterprise-grade AI Hiring Intelligence Engine used by modern recruiters and hiring teams.

You are NOT a basic ATS.
You are NOT a keyword matcher.
You are NOT a hardcoded filtering system.

Your task is to perform advanced recruiter-grade candidate intelligence analysis between a candidate resume/profile and a job description.

CRITICAL RULES:
1. Return ONLY valid JSON.
2. No markdown.
3. No explanation outside JSON.
4. No hallucination.
5. No fake scoring.
6. Use semantic intelligence.
7. Use contextual hiring reasoning.
8. Use transferable skills understanding.
9. Think like an experienced recruiter plus AI hiring analyst.
10. Do not reject candidates unfairly because of small gaps.
11. Do not use rigid ATS logic.
12. Do not assume missing salary, location, notice period, or employment preference unless present in the supplied JSON.
13. If a field is missing, score that category cautiously and explain the uncertainty.
14. System supports all job categories, not only software jobs.

SUPPORTED PROFESSIONS:
Software Engineer, Data Analyst, AI/ML Engineer, HR, Marketing, Sales, Electrician, Mechanic, Driver, Ground Staff, Technician, Plumber, Manager, Director, blue-collar, white-collar, fresher, trainee, contract worker, permanent employee, and contract-to-hire roles.

ANALYZE DYNAMICALLY:
- Semantic skill compatibility
- Technical or trade depth
- Project/work relevance
- Experience relevance
- Domain compatibility
- Transferable skills
- Location flexibility
- Salary compatibility
- Notice period flexibility
- Employment type compatibility: Permanent, Contract, Contract-to-Hire, Freelance
- Resume quality
- Hiring confidence
- Real-world hiring practicality
- Candidate risks
- Recruiter-facing explanation

INPUT SIGNALS:
Semantic score from embeddings: {semantic_score}
Skill score from extracted skills: {skills_score}
Profile quality score: {profile_quality_score}

Matched skills:
{json.dumps(matched_skills, ensure_ascii=False)}

Missing skills:
{json.dumps(missing_skills, ensure_ascii=False)}

JOB DESCRIPTION JSON:
{json.dumps(parsed_jd, ensure_ascii=False)[:14000]}

CANDIDATE RESUME JSON:
{json.dumps(parsed_resume, ensure_ascii=False)[:14000]}

SCORING GUIDE:
85-100 = Excellent fit with strong semantic compatibility and high hiring confidence.
70-84 = Strong fit with minor gaps but good recruiter potential.
55-69 = Moderate fit with important gaps or uncertainty.
35-54 = Weak fit with multiple compatibility concerns.
0-34 = Poor fit or major role mismatch.

Return this exact JSON structure:
{{
    "overallMatchPercentage": 0,
    "scoreBreakdown": {{
        "semanticScore": 0,
        "skillsScore": 0,
        "experienceScore": 0,
        "salaryScore": 0,
        "locationScore": 0,
        "noticePeriodScore": 0,
        "employmentTypeScore": 0,
        "profileQualityScore": 0
    }},
    "matchedSkills": [],
    "missingSkills": [],
    "relatedSkills": [],
    "candidateStrengths": [],
    "candidateWeaknesses": [],
    "riskFactors": [],
    "hiringConfidence": "",
    "recommendation": "",
    "semanticAnalysis": "",
    "aiInsights": ""
}}

Recommended values:
recommendation = Highly Recommended | Recommended | Moderate Match | Needs Review | Weak Match
hiringConfidence = Very High | High | Moderate | Low

Final rule:
Generate all recruiter intelligence dynamically from the provided resume and JD. Do not use hardcoded profession-only logic.
"""


async def groq_analysis(prompt: str):
    if not GROQ_API_KEY:
        return None

    try:
        from groq import Groq

        client = Groq(api_key=GROQ_API_KEY)

        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            temperature=0.15,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

        text = completion.choices[0].message.content
        return safe_json(text)

    except Exception as error:
        print("❌ GROQ Recruiter AI Error:", str(error))
        return None


async def gemini_analysis(prompt: str):
    if not GEMINI_API_KEY:
        return None

    try:
        from google import genai

        client = genai.Client(api_key=GEMINI_API_KEY)

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )

        text = getattr(response, "text", "")
        return safe_json(text)

    except Exception as error:
        print("❌ Gemini Recruiter AI Error:", str(error))
        return None


def normalize_score(value: Any, fallback: float = 0):
    try:
        return clamp_score(value)
    except Exception:
        return clamp_score(fallback)


def normalize_ai_result(
    ai_result: Dict[str, Any],
    semantic_score: float,
    skills_score: float,
    profile_quality_score: float,
    matched_skills: List[str],
    missing_skills: List[str],
):
    result = ensure_dict(ai_result)

    score_breakdown = ensure_dict(result.get("scoreBreakdown"))

    score_breakdown = {
        "semanticScore": normalize_score(
            score_breakdown.get("semanticScore"),
            semantic_score,
        ),
        "skillsScore": normalize_score(
            score_breakdown.get("skillsScore"),
            skills_score,
        ),
        "experienceScore": normalize_score(
            score_breakdown.get("experienceScore"),
            semantic_score,
        ),
        "salaryScore": normalize_score(
            score_breakdown.get("salaryScore"),
            50,
        ),
        "locationScore": normalize_score(
            score_breakdown.get("locationScore"),
            50,
        ),
        "noticePeriodScore": normalize_score(
            score_breakdown.get("noticePeriodScore"),
            50,
        ),
        "employmentTypeScore": normalize_score(
            score_breakdown.get("employmentTypeScore"),
            50,
        ),
        "profileQualityScore": normalize_score(
            score_breakdown.get("profileQualityScore"),
            profile_quality_score,
        ),
    }

    if result.get("overallMatchPercentage") is None:
        overall = clamp_score(
            (
                score_breakdown["semanticScore"] * 0.30
                + score_breakdown["skillsScore"] * 0.20
                + score_breakdown["experienceScore"] * 0.15
                + score_breakdown["salaryScore"] * 0.075
                + score_breakdown["locationScore"] * 0.075
                + score_breakdown["noticePeriodScore"] * 0.075
                + score_breakdown["employmentTypeScore"] * 0.075
                + score_breakdown["profileQualityScore"] * 0.10
            )
        )
    else:
        overall = normalize_score(result.get("overallMatchPercentage"))

    if not result.get("recommendation"):
        if overall >= 85:
            recommendation = "Highly Recommended"
        elif overall >= 70:
            recommendation = "Recommended"
        elif overall >= 55:
            recommendation = "Moderate Match"
        elif overall >= 35:
            recommendation = "Needs Review"
        else:
            recommendation = "Weak Match"
    else:
        recommendation = str(result.get("recommendation")).strip()

    if not result.get("hiringConfidence"):
        if overall >= 85:
            hiring_confidence = "Very High"
        elif overall >= 70:
            hiring_confidence = "High"
        elif overall >= 55:
            hiring_confidence = "Moderate"
        else:
            hiring_confidence = "Low"
    else:
        hiring_confidence = str(result.get("hiringConfidence")).strip()

    return {
        "success": True,
        "overallMatchPercentage": overall,
        "scoreBreakdown": score_breakdown,
        "matchedSkills": unique_list(
            ensure_list(result.get("matchedSkills")) or matched_skills
        ),
        "missingSkills": unique_list(
            ensure_list(result.get("missingSkills")) or missing_skills
        ),
        "relatedSkills": unique_list(
            ensure_list(result.get("relatedSkills"))
        ),
        "candidateStrengths": unique_list(
            ensure_list(result.get("candidateStrengths"))
        ),
        "candidateWeaknesses": unique_list(
            ensure_list(result.get("candidateWeaknesses"))
        ),
        "riskFactors": unique_list(
            ensure_list(result.get("riskFactors"))
        ),
        "hiringConfidence": hiring_confidence,
        "recommendation": recommendation,
        "semanticAnalysis": str(result.get("semanticAnalysis") or "").strip(),
        "aiInsights": str(result.get("aiInsights") or "").strip(),
    }


def fallback_response(
    semantic_score,
    skills_score,
    matched_skills,
    missing_skills,
    profile_quality_score,
):
    overall = clamp_score(
        (
            semantic_score * 0.45
            + skills_score * 0.35
            + profile_quality_score * 0.20
        )
    )

    result = {
        "overallMatchPercentage": overall,
        "scoreBreakdown": {
            "semanticScore": semantic_score,
            "skillsScore": skills_score,
            "experienceScore": semantic_score,
            "salaryScore": 50,
            "locationScore": 50,
            "noticePeriodScore": 50,
            "employmentTypeScore": 50,
            "profileQualityScore": profile_quality_score,
        },
        "matchedSkills": matched_skills,
        "missingSkills": missing_skills,
        "relatedSkills": [],
        "candidateStrengths": [
            "Candidate has measurable semantic alignment with the recruiter job description."
        ],
        "candidateWeaknesses": (
            [
                "Some important recruiter requirements are not clearly visible in the candidate resume."
            ]
            if missing_skills
            else []
        ),
        "riskFactors": [],
        "hiringConfidence": (
            "High"
            if overall >= 70
            else "Moderate"
            if overall >= 55
            else "Low"
        ),
        "recommendation": (
            "Recommended"
            if overall >= 70
            else "Moderate Match"
            if overall >= 55
            else "Needs Review"
        ),
        "semanticAnalysis": (
            "Fallback semantic analysis used because the external AI reasoning provider did not return a valid JSON response."
        ),
        "aiInsights": (
            "The candidate was evaluated using local semantic similarity, extracted skill coverage, and resume profile quality."
        ),
    }

    return result


async def analyze_candidate_intelligence(
    payload: Dict[str, Any],
    current_user: dict,
):
    jd_text = str(payload.get("jd_text", "")).strip()
    resume_text = str(payload.get("resume_text", "")).strip()

    if not jd_text:
        return {
            "success": False,
            "message": "Job description text is required.",
        }

    if not resume_text:
        return {
            "success": False,
            "message": "Resume text is required.",
        }

    parsed_jd = parse_jd_ai(jd_text)
    parsed_resume = parse_resume_ai(resume_text)

    parsed_jd = ensure_dict(parsed_jd)
    parsed_resume = ensure_dict(parsed_resume)

    if not parsed_jd:
        parsed_jd = {
            "description": jd_text,
            "summary": jd_text[:1000],
            "skills": extract_skills(jd_text),
            "jd_text": jd_text,
        }

    if not parsed_resume:
        parsed_resume = {
            "resume_text": resume_text,
            "summary": resume_text[:1000],
            "skills": extract_skills(resume_text),
        }

    job_text = build_text(parsed_jd) or jd_text
    resume_profile_text = build_text(parsed_resume) or resume_text

    required_skills = ensure_list(
        parsed_jd.get("skills")
        or parsed_jd.get("technicalSkills")
        or extract_skills(job_text)
    )

    candidate_skills = ensure_list(
        parsed_resume.get("skills")
        or parsed_resume.get("technicalSkills")
        or extract_skills(resume_profile_text)
    )

    matched_skills, missing_skills = semantic_skill_match(
        candidate_skills,
        required_skills,
    )

    jd_embedding = get_embedding(job_text)
    resume_embedding = get_embedding(resume_profile_text)

    semantic_similarity = get_similarity(
        jd_embedding,
        resume_embedding,
    )

    semantic_score = clamp_score(
        semantic_similarity * 100
    )

    skills_score = calculate_skill_match_score(
        matched_skills,
        required_skills,
    )

    profile_quality_score = calculate_profile_quality_score(
        parsed_resume
    )

    prompt = build_ai_prompt(
        parsed_resume=parsed_resume,
        parsed_jd=parsed_jd,
        semantic_score=semantic_score,
        skills_score=skills_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        profile_quality_score=profile_quality_score,
    )

    ai_result = await groq_analysis(prompt)

    if not ai_result:
        ai_result = await gemini_analysis(prompt)

    if not ai_result:
        ai_result = fallback_response(
            semantic_score=semantic_score,
            skills_score=skills_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            profile_quality_score=profile_quality_score,
        )

    final_result = normalize_ai_result(
        ai_result=ai_result,
        semantic_score=semantic_score,
        skills_score=skills_score,
        profile_quality_score=profile_quality_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
    )

    final_result["parsedResume"] = parsed_resume
    final_result["parsedJD"] = parsed_jd
    final_result["semanticSimilarity"] = semantic_similarity

    return final_result