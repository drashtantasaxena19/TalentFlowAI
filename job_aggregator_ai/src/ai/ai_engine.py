import os
import json
from typing import Optional, Dict, Any, List

from dotenv import load_dotenv

load_dotenv()

USE_AI = os.getenv("USE_AI", "true").lower() == "true"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")


def safe_json(text: Optional[str]) -> Optional[Dict[str, Any]]:
    try:
        if not text:
            return None

        cleaned = (
            text.replace("```json", "")
            .replace("```JSON", "")
            .replace("```", "")
            .strip()
        )

        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1

        if start == -1 or end <= start:
            return None

        return json.loads(cleaned[start:end])

    except Exception as e:
        print("❌ AI JSON parse failed:", e)
        return None


def _as_list(value: Any) -> List[str]:
    if value is None:
        return []

    if isinstance(value, list):
        raw_items = value
    elif isinstance(value, str):
        raw_items = [x.strip() for x in value.replace("|", ",").split(",")]
    else:
        raw_items = [str(value)]

    cleaned = []
    seen = set()

    for item in raw_items:
        if isinstance(item, dict):
            item = json.dumps(item, ensure_ascii=False)

        text = str(item).strip()

        if not text:
            continue

        key = text.lower()

        if key not in seen:
            cleaned.append(text)
            seen.add(key)

    return cleaned


def clamp_score(value: Any) -> float:
    try:
        number = float(value)
    except Exception:
        number = 0

    return round(max(0, min(100, number)), 2)


def build_match_prompt(resume_text: str, job_text: str) -> str:
    return f"""
You are TalentFlow AI, an expert recruitment assistant and ATS matching engine.

Your task:
Compare the candidate resume/profile with the job description and generate a precise job-fit analysis.

IMPORTANT ACCURACY RULES:
- Return ONLY strict valid JSON.
- No markdown.
- No explanation outside JSON.
- Do not invent skills.
- Use resume evidence only.
- Use semantic matching: React.js = React, JS = JavaScript, ML = Machine Learning, PowerBI = Power BI.
- Separate required, matched, and missing skills carefully.
- Match score must represent real job readiness.
- Do not give random score.
- Missing skills must contain only important job skills not clearly found in resume.
- Matched skills must contain only skills clearly present or strongly evidenced.
- Give weightage for every matched and missing skill.
- Salary should be India-focused unless job text clearly indicates another country.

OUTPUT JSON FORMAT:
{{
  "is_fit": false,
  "match_score": 0,
  "required_skills": [],
  "matched_skills": [],
  "missing_skills": [],
  "matchedSkillsWeightage": [
    {{
      "skill": "",
      "weightage": 0,
      "reason": ""
    }}
  ],
  "missingSkillsWeightage": [
    {{
      "skill": "",
      "weightage": 0,
      "reason": ""
    }}
  ],
  "suggested_questions": [],
  "salary_suggestion": {{
    "min": 0,
    "max": 0,
    "currency": "INR",
    "explanation": ""
  }},
  "key_strengths": [],
  "reason": "",
  "learning_suggestions": [],
  "career_advice": "",
  "ai_insights": ""
}}

SCORING GUIDE:
- 85-100: Excellent fit, most core skills and strong evidence.
- 70-84: Good fit, important skills present, minor gaps.
- 55-69: Moderate fit, some important gaps.
- 35-54: Weak fit, many missing core skills.
- 0-34: Poor fit, role mismatch.

Candidate Resume/Profile:
{resume_text[:9000]}

Job Description:
{job_text[:6000]}
"""


def normalize_match_result(data: Dict[str, Any]) -> Dict[str, Any]:
    required_skills = _as_list(data.get("required_skills"))
    matched_skills = _as_list(data.get("matched_skills"))
    missing_skills = _as_list(data.get("missing_skills"))

    match_score = clamp_score(data.get("match_score", 0))

    matched_weightage = data.get("matchedSkillsWeightage") or data.get("matched_skills_weightage") or []
    missing_weightage = data.get("missingSkillsWeightage") or data.get("missing_skills_weightage") or []

    return {
        "is_fit": bool(data.get("is_fit", match_score >= 55)),
        "match_score": match_score,
        "required_skills": required_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "matchedSkillsWeightage": matched_weightage if isinstance(matched_weightage, list) else [],
        "missingSkillsWeightage": missing_weightage if isinstance(missing_weightage, list) else [],
        "suggested_questions": _as_list(data.get("suggested_questions") or data.get("suggestedQuestions")),
        "salary_suggestion": data.get("salary_suggestion") or data.get("salarySuggestion") or {
            "min": 0,
            "max": 0,
            "currency": "INR",
            "explanation": "",
        },
        "key_strengths": _as_list(data.get("key_strengths") or data.get("keyStrengths")),
        "reason": str(data.get("reason", "")).strip(),
        "learning_suggestions": _as_list(data.get("learning_suggestions")),
        "career_advice": str(data.get("career_advice", "")).strip(),
        "ai_insights": str(data.get("ai_insights") or data.get("aiInsights") or "").strip(),
        "source": data.get("source", "AI"),
    }


def match_with_gemini(resume_text: str, job_text: str) -> Optional[Dict[str, Any]]:
    if not GEMINI_API_KEY:
        return None

    try:
        from google import genai

        client = genai.Client(api_key=GEMINI_API_KEY)

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=build_match_prompt(resume_text, job_text),
        )

        data = safe_json(getattr(response, "text", ""))

        if not data:
            return None

        result = normalize_match_result(data)
        result["source"] = "Gemini AI"

        return result

    except Exception as e:
        print("❌ Gemini match analysis failed:", e)
        return None


def match_with_groq(resume_text: str, job_text: str) -> Optional[Dict[str, Any]]:
    if not GROQ_API_KEY:
        return None

    try:
        from groq import Groq

        client = Groq(api_key=GROQ_API_KEY)

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are TalentFlow AI ATS matching engine. Return only strict valid JSON.",
                },
                {
                    "role": "user",
                    "content": build_match_prompt(resume_text, job_text),
                },
            ],
            temperature=0.1,
            max_tokens=3500,
        )

        content = response.choices[0].message.content
        data = safe_json(content)

        if not data:
            return None

        result = normalize_match_result(data)
        result["source"] = "Groq AI"

        return result

    except Exception as e:
        print("❌ Groq match analysis failed:", e)
        return None


def ai_match_analysis(resume_text: str, job_text: str) -> Optional[Dict[str, Any]]:
    if not USE_AI:
        return None

    if not resume_text or not resume_text.strip() or not job_text or not job_text.strip():
        return None

    groq_result = match_with_groq(resume_text, job_text)

    if groq_result:
        return groq_result

    gemini_result = match_with_gemini(resume_text, job_text)

    if gemini_result:
        return gemini_result

    return None