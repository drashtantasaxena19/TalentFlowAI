import os
import json
import re
from typing import Dict, Any

from groq import Groq

from src.ai.scorer import clamp_score
from src.ai.prompts import (
    PROFILE_ANALYZER_SYSTEM_PROMPT,
    build_profile_analysis_prompt,
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.1-8b-instant",
)

ENABLE_AI_REASONING = (
    os.getenv("ENABLE_AI_REASONING", "true").lower() == "true"
)

client = Groq(api_key=GROQ_API_KEY)


def safe_json(text):
    try:
        if not text:
            return None

        cleaned = (
            str(text)
            .replace("```json", "")
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


def repair_json(text):
    try:
        if not text:
            return None

        cleaned = str(text).strip()

        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1

        if start == -1 or end <= start:
            return None

        repaired = cleaned[start:end]

        repaired = re.sub(r",\s*}", "}", repaired)
        repaired = re.sub(r",\s*]", "]", repaired)

        return json.loads(repaired)

    except Exception:
        return None


def clean_profile(profile: Dict[str, Any]):
    return {
        "name": profile.get("fullName", ""),
        "role": profile.get("role", ""),
        "summary": profile.get("summary", ""),
        "skills": profile.get("skills", []),
        "experience": profile.get("experience", ""),
        "experienceYears": profile.get("experienceYears", 0),
        "education": profile.get("education", ""),
        "projects": profile.get("projects", []),
        "certifications": profile.get("certifications", []),
        "resume_text": str(profile.get("resume_text", ""))[:6000],
    }


def calculate_profile_completeness(profile: Dict[str, Any]):
    score = 0

    if profile.get("summary"):
        score += 15

    if profile.get("skills"):
        score += 25

    if profile.get("experience"):
        score += 20

    if profile.get("education"):
        score += 15

    if profile.get("projects"):
        score += 15

    if profile.get("certifications"):
        score += 10

    return clamp_score(score)


async def analyze_candidate_profile(profile: Dict[str, Any]):
    cleaned_profile = clean_profile(profile)

    profile_completeness = calculate_profile_completeness(
        cleaned_profile
    )

    fallback = {
        "profileScore": profile_completeness,
        "atsScore": profile_completeness,
        "detectedRole": cleaned_profile.get("role", ""),
        "careerLevel": "Fresher",
        "profileCompleteness": profile_completeness,
        "skillsScore": 50,
        "experienceScore": 40,
        "educationScore": 60,
        "projectScore": 40,
        "atsReadinessScore": 50,
        "strengths": [],
        "weaknesses": [],
        "matchedSkills": cleaned_profile.get("skills", []),
        "missingSkills": [],
        "recommendedSkills": [],
        "careerSuggestions": [],
        "recommendedRoles": [],
        "interviewQuestions": [],
        "salarySuggestion": {
            "min": "",
            "max": "",
            "currency": "",
        },
        "aiInsights": "",
        "scoreBreakdown": {
            "skills": 50,
            "experience": 40,
            "education": 60,
            "projects": 40,
            "ats": 50,
        },
        "confidence": 0.50,
        "source": "fallback-analysis",
    }

    if not GROQ_API_KEY or not ENABLE_AI_REASONING:
        return fallback

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": PROFILE_ANALYZER_SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": build_profile_analysis_prompt(
                        cleaned_profile
                    ),
                },
            ],
            temperature=0.2,
            max_tokens=3000,
        )

        content = response.choices[0].message.content

        data = (
            safe_json(content)
            or repair_json(content)
        )

        if not data:
            return fallback

        data["profileScore"] = clamp_score(
            data.get(
                "profileScore",
                profile_completeness,
            )
        )

        data["atsScore"] = clamp_score(
            data.get(
                "atsScore",
                profile_completeness,
            )
        )

        data["profileCompleteness"] = (
            profile_completeness
        )

        data["confidence"] = max(
            0,
            min(
                1,
                float(
                    data.get(
                        "confidence",
                        0.80,
                    )
                ),
            ),
        )

        data["source"] = "groq-ai-analysis"

        return data

    except Exception as error:
        print(
            "❌ Profile Analysis Error:",
            str(error),
        )

        return fallback