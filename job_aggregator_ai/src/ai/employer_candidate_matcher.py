import json
import os
import re
from typing import Dict, Any, List, Optional

from src.ai.resume_parser import extract_skills


# =========================
# CONFIG
# =========================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-70b-8192")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")


# =========================
# HELPERS
# =========================
def clamp_score(value):
    try:
        value = int(float(value))
    except Exception:
        value = 0

    return max(0, min(100, value))


def normalize_skill(skill: str) -> str:
    return re.sub(r"\s+", " ", str(skill or "").strip().lower())


def unique_list(items: List[str]) -> List[str]:
    seen = set()
    result = []

    for item in items:
        text = str(item or "").strip()

        if not text:
            continue

        key = text.lower()

        if key not in seen:
            seen.add(key)
            result.append(text)

    return result


def safe_json(text: str) -> Optional[Dict[str, Any]]:
    try:
        if not text:
            return None

        cleaned = (
            text.replace("```json", "")
            .replace("```", "")
            .strip()
        )

        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1

        if start == -1 or end <= start:
            return None

        return json.loads(cleaned[start:end])

    except Exception:
        return None


# =========================
# PROMPT
# =========================
def build_employer_match_prompt(job: Dict[str, Any], applicant: Dict[str, Any]) -> str:
    return f"""
You are TalentFlow AI Employer Hiring Engine.

TASK:
Rank candidate against job with ATS precision.

STRICT RULES:
- Return ONLY valid JSON
- No markdown
- No extra explanation
- No hallucination
- Score based on evidence only
- Match score = 0 to 100

JSON FORMAT:
{{
  "matchScore": 0,
  "matchedSkills": [],
  "missingSkills": [],
  "strengths": [],
  "weaknesses": [],
  "interviewQuestions": [],
  "recommendation": "",
  "aiStatus": "",
  "aiInsights": ""
}}

JOB:
Title: {job.get("title", "")}
Skills: {job.get("skills", [])}
Experience: {job.get("experience", "")}
Description: {job.get("description", "")}

CANDIDATE:
Name: {applicant.get("name", "")}
Role: {applicant.get("role", "")}
Skills: {applicant.get("skills", [])}
Experience: {applicant.get("experience", "")}
Projects: {applicant.get("projects", [])}
Resume: {str(applicant.get("resumeText", ""))[:7000]}
"""


# =========================
# GROQ
# =========================
async def groq_match(job: Dict[str, Any], applicant: Dict[str, Any]):
    if not GROQ_API_KEY:
        return None

    try:
        from groq import Groq

        client = Groq(api_key=GROQ_API_KEY)

        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": build_employer_match_prompt(job, applicant),
                }
            ],
            temperature=0.2,
        )

        text = completion.choices[0].message.content
        return safe_json(text)

    except Exception:
        return None


# =========================
# GEMINI
# =========================
async def gemini_match(job: Dict[str, Any], applicant: Dict[str, Any]):
    if not GEMINI_API_KEY:
        return None

    try:
        from google import genai

        client = genai.Client(api_key=GEMINI_API_KEY)

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=build_employer_match_prompt(job, applicant),
        )

        text = getattr(response, "text", "")
        return safe_json(text)

    except Exception:
        return None


# =========================
# DETERMINISTIC
# =========================
def deterministic_match(job: Dict[str, Any], applicant: Dict[str, Any]):
    job_text = " ".join([
        str(job.get("title", "")),
        str(job.get("description", "")),
        " ".join(job.get("skills", []) if isinstance(job.get("skills"), list) else [str(job.get("skills", ""))]),
    ])

    required_skills = unique_list(
        job.get("skills", [])
        if isinstance(job.get("skills"), list)
        else extract_skills(job_text)
    )

    candidate_skills = applicant.get("skills", [])

    if isinstance(candidate_skills, str):
        candidate_skills = [
            skill.strip()
            for skill in candidate_skills.split(",")
            if skill.strip()
        ]

    candidate_skills = unique_list(candidate_skills)

    required_map = {normalize_skill(skill): skill for skill in required_skills}
    candidate_map = {normalize_skill(skill): skill for skill in candidate_skills}

    matched = []
    missing = []

    for req_key, req_value in required_map.items():
        found = False

        for cand_key in candidate_map.keys():
            if req_key == cand_key or req_key in cand_key or cand_key in req_key:
                matched.append(req_value)
                found = True
                break

        if not found:
            missing.append(req_value)

    required_count = len(required_skills)

    skill_score = (
        (len(matched) / required_count) * 75
        if required_count > 0
        else 50
    )

    role_score = 0
    candidate_role = str(applicant.get("role", "")).lower()
    job_title = str(job.get("title", "")).lower()

    if candidate_role and any(word in candidate_role for word in job_title.split()):
        role_score = 15

    project_score = 10 if applicant.get("projects") else 0

    final_score = clamp_score(skill_score + role_score + project_score)

    if final_score >= 85:
        recommendation = "Highly Recommended"
        status = "Strong Match"
    elif final_score >= 70:
        recommendation = "Recommended"
        status = "Good Match"
    elif final_score >= 50:
        recommendation = "Consider for Review"
        status = "Moderate Match"
    else:
        recommendation = "Low Priority"
        status = "Needs Review"

    return {
        "matchScore": final_score,
        "matchedSkills": matched,
        "missingSkills": missing,
        "strengths": matched[:5],
        "weaknesses": missing[:5],
        "interviewQuestions": [
            f"Explain your experience with {skill}."
            for skill in missing[:3]
        ],
        "recommendation": recommendation,
        "aiStatus": status,
        "aiInsights": (
            f"Matched {len(matched)} of {required_count} required skills. "
            f"Strong areas: {', '.join(matched[:4]) if matched else 'Limited direct match'}. "
            f"Missing priority skills: {', '.join(missing[:4]) if missing else 'No major gaps'}."
        ),
    }


# =========================
# MAIN ENGINE
# =========================
async def analyze_candidate_match(job: Dict[str, Any], applicant: Dict[str, Any]):
    # PRIORITY 1: GROQ
    ai_result = await groq_match(job, applicant)

    # PRIORITY 2: GEMINI
    if not ai_result:
        ai_result = await gemini_match(job, applicant)

    # AI SUCCESS
    if ai_result:
        return {
            "matchScore": clamp_score(ai_result.get("matchScore", 0)),
            "matchedSkills": unique_list(ai_result.get("matchedSkills", [])),
            "missingSkills": unique_list(ai_result.get("missingSkills", [])),
            "strengths": unique_list(ai_result.get("strengths", [])),
            "weaknesses": unique_list(ai_result.get("weaknesses", [])),
            "interviewQuestions": unique_list(ai_result.get("interviewQuestions", [])),
            "recommendation": ai_result.get("recommendation", "Needs Review"),
            "aiStatus": ai_result.get("aiStatus", "AI Reviewed"),
            "aiInsights": ai_result.get("aiInsights", ""),
        }

    # FINAL FALLBACK
    return deterministic_match(job, applicant)