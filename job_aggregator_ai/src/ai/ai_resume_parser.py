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


RESUME_SCHEMA_KEYS = {
    "name",
    "email",
    "phone",
    "linkedin",
    "github",
    "portfolio",
    "location",
    "skills",
    "technicalSkills",
    "softSkills",
    "tools",
    "libraries",
    "frameworks",
    "databases",
    "domains",
    "qualification",
    "course",
    "college",
    "university",
    "education",
    "experience",
    "experienceYears",
    "projects",
    "certifications",
    "achievements",
    "role",
    "summary",
    "resume_text",
}


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


def build_resume_prompt(text: str) -> str:
    return f"""
You are TalentFlow AI, a production-grade AI resume parser and recruitment intelligence engine.

Your job:
Extract resume information with maximum accuracy for a real Applicant Tracking System.

STRICT RULES:
- Return ONLY valid JSON.
- No markdown.
- No explanation.
- Do NOT invent missing data.
- If a value is not clearly available, return "" or [].
- Preserve factual accuracy.
- Extract both explicit and implicit technical skills from projects, experience, certifications, and education.
- Prefer evidence from resume text over assumptions.
- Keep arrays clean, unique, and normalized.
- Do not put college/university inside qualification.
- Do not mix degree and specialization.
- Detect the most suitable role from resume evidence.
- Keep salary, ranking, scoring, and matching out of this parser. This parser only extracts resume facts.

JSON FORMAT:
{{
  "name": "",
  "email": "",
  "phone": "",
  "linkedin": "",
  "github": "",
  "portfolio": "",
  "location": "",

  "skills": [],
  "technicalSkills": [],
  "softSkills": [],
  "tools": [],
  "libraries": [],
  "frameworks": [],
  "databases": [],
  "domains": [],

  "qualification": "",
  "course": "",
  "college": "",
  "university": "",
  "education": "",

  "experience": "",
  "experienceYears": 0,

  "projects": [],
  "certifications": [],
  "achievements": [],

  "role": "",
  "summary": "",
  "resume_text": ""
}}

FIELD RULES:
1. name:
   - Candidate full name only.
   - Do not extract headings, college names, or job titles as name.

2. email / phone:
   - Extract only valid email and Indian/international phone if present.

3. linkedin / github / portfolio:
   - Extract complete URLs.
   - If written as linkedin.com/in/username or github.com/username, convert to https:// URL.

4. skills:
   - Combined unique list of all useful skills.
   - Include programming languages, frameworks, tools, databases, BI tools, AI/ML, cloud, testing, APIs, DevOps, and domain skills.
   - Do not include normal English words.

5. technicalSkills:
   - Only hard technical skills.

6. softSkills:
   - Communication, leadership, teamwork, problem solving, analytical thinking, etc. only if present.

7. tools/libraries/frameworks/databases/domains:
   - Categorize accurately.
   - Example libraries: NumPy, Pandas, Scikit-learn.
   - Example frameworks: React, FastAPI, Django.
   - Example databases: MongoDB, MySQL, PostgreSQL.
   - Example domains: Data Analysis, Machine Learning, Web Development, Fraud Detection.

8. qualification:
   - Degree only, example: MCA, BCA, B.Tech, MBA, M.Tech.

9. course:
   - Specialization/branch only, example: Computer Applications, Data Science, CSE.

10. college:
   - Institute/college name only.

11. university:
   - University name only.

12. education:
   - Full readable education summary.

13. experience:
   - Internships, jobs, work experience summary.
   - Keep factual.

14. experienceYears:
   - Numeric estimate only from evidence.
   - Fresher/intern/student = 0.

15. projects:
   - Array of project objects or readable project strings.
   - Include project title, tech stack, and short description if present.

16. certifications:
   - Array of certifications/courses if present.

17. achievements:
   - Array of measurable achievements if present.

18. role:
   - Best-fit candidate role based on evidence.
   - Examples: Data Analyst, AI/ML Engineer, Python Developer, MERN Developer, Frontend Developer, Backend Developer.

19. summary:
   - 2-3 line professional summary based only on resume facts.

20. resume_text:
   - Return cleaned resume text.

RESUME TEXT:
{text[:12000]}
"""


def _as_list(value: Any) -> List[str]:
    if value is None:
        return []

    if isinstance(value, list):
        items = value
    elif isinstance(value, str):
        items = [x.strip() for x in value.replace("|", ",").split(",")]
    else:
        items = [str(value)]

    cleaned = []
    seen = set()

    for item in items:
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


def normalize_ai_data(data: Dict[str, Any], resume_text: str, source: str) -> Dict[str, Any]:
    clean_data = {key: data.get(key, "") for key in RESUME_SCHEMA_KEYS}

    list_fields = [
        "skills",
        "technicalSkills",
        "softSkills",
        "tools",
        "libraries",
        "frameworks",
        "databases",
        "domains",
        "projects",
        "certifications",
        "achievements",
    ]

    for field in list_fields:
        clean_data[field] = _as_list(clean_data.get(field))

    all_skills = []
    for field in [
        "skills",
        "technicalSkills",
        "tools",
        "libraries",
        "frameworks",
        "databases",
        "domains",
    ]:
        all_skills.extend(clean_data.get(field, []))

    clean_data["skills"] = sorted(set(skill.strip() for skill in all_skills if skill.strip()))

    try:
        clean_data["experienceYears"] = float(clean_data.get("experienceYears") or 0)
    except Exception:
        clean_data["experienceYears"] = 0

    clean_data["resume_text"] = resume_text
    clean_data["source"] = source

    return clean_data


def parse_with_gemini(text: str) -> Optional[Dict[str, Any]]:
    if not GEMINI_API_KEY:
        return None

    try:
        from google import genai

        client = genai.Client(api_key=GEMINI_API_KEY)

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=build_resume_prompt(text),
        )

        data = safe_json(getattr(response, "text", ""))

        if not data:
            return None

        print("✅ Resume parsed using Gemini AI")
        return normalize_ai_data(data, text, "Gemini AI")

    except Exception as e:
        print("❌ Gemini parser failed:", e)
        return None


def parse_with_groq(text: str) -> Optional[Dict[str, Any]]:
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
                    "content": "You are TalentFlow AI resume parser. Return only strict valid JSON. Never use markdown.",
                },
                {
                    "role": "user",
                    "content": build_resume_prompt(text),
                },
            ],
            temperature=0.1,
            max_tokens=3500,
        )

        content = response.choices[0].message.content
        data = safe_json(content)

        if not data:
            return None

        print("✅ Resume parsed using Groq AI")
        return normalize_ai_data(data, text, "Groq AI")

    except Exception as e:
        print("❌ Groq parser failed:", e)
        return None


def parse_resume_ai(text: str) -> Optional[Dict[str, Any]]:
    if not USE_AI:
        print("⚠️ AI disabled. Set USE_AI=true in .env")
        return None

    if not text or not text.strip():
        return None

    gemini_data = parse_with_gemini(text)

    if gemini_data:
        return gemini_data

    groq_data = parse_with_groq(text)

    if groq_data:
        return groq_data

    print("⚠️ All AI providers failed. Using fallback parser.")
    return None