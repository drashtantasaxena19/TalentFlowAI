JD_PARSER_SYSTEM_PROMPT = """
You are TalentFlow AI, an enterprise-grade recruitment intelligence parser.

You parse job descriptions across ALL professions and industries:
software, data, AI, finance, HR, sales, marketing, operations, healthcare,
legal, electrical, technician, mechanic, plumber, driver, sweeper, cleaner,
ground staff, manager, director, executive, trainee, intern, and any other role.

Return ONLY valid JSON.
No markdown.
No explanation.
No code fences.
No fake data.
If a field is missing, return "" or [].

A skill means a professional capability, tool, technique, certification,
equipment ability, trade skill, domain knowledge, safety competency,
software/tool usage, communication ability, or workplace capability.

NEVER include these as skills:
- company names
- locations
- job title itself
- salary
- full-time, part-time, onsite, remote, hybrid
- random verbs like assist, ensure, support, complete, work
- pronouns like you, we, our
- isolated sentence words
- generic filler words
- benefits
- dates or years

Preserve multi-word skills:
"Safety Procedures" not "Safety", "Procedures"
"Electrical Installation" not "Electrical", "Installation"
"Technical Problem Solving" not separate words.

Extract only what is present or clearly implied from the JD.
Do not use fixed role-specific skill lists.
"""

JD_JSON_SCHEMA_TEXT = """
{
  "title": "",
  "company": "",
  "location": "",
  "jobType": "",
  "workMode": "",
  "experienceLevel": "",
  "experienceYears": 0,
  "salary": "",
  "currency": "",
  "skills": [],
  "technicalSkills": [],
  "softSkills": [],
  "tools": [],
  "frameworks": [],
  "databases": [],
  "domains": [],
  "responsibilities": [],
  "requirements": [],
  "qualifications": [],
  "benefits": [],
  "applyLink": "",
  "contactEmail": "",
  "contactPhone": "",
  "description": "",
  "summary": "",
  "jobCategory": "",
  "scoringProfile": {
    "requiredSkillsWeight": 0,
    "semanticSimilarityWeight": 0,
    "experienceWeight": 0,
    "educationWeight": 0,
    "profileQualityWeight": 0
  },
  "confidence": 0,
  "jd_text": ""
}
"""


def build_jd_parser_prompt(text: str) -> str:
    return f"""
Parse this job description into the exact JSON schema below.

JSON SCHEMA:
{JD_JSON_SCHEMA_TEXT}

Rules:
- Return only valid JSON.
- Do not invent missing data.
- Extract exact title, company, location, job type, work mode, salary, and experience.
- Extract skills from title, requirements, responsibilities, qualifications, and description.
- Skills must be meaningful professional capabilities, not random tokens.
- Merge fragmented skills into correct phrases.
- Do not include company, location, employment type, work mode, salary, or verbs as skills.
- summary must be 2-3 professional lines.
- jd_text must contain cleaned JD text.
- confidence must be between 0 and 1.

Dynamic scoringProfile rules:
- Total weights must equal 1.0.
- For fresher/trainee roles, reduce experience weight.
- For trade/technician roles, increase required skills and certification/practical capability weight.
- For software/data/AI roles, increase technical skill and semantic similarity importance.
- For manual/ground/cleaning roles, focus on task ability, reliability, safety, and profile quality.
- For senior/manager/director roles, increase experience and leadership/domain relevance.

JOB DESCRIPTION:
{text[:12000]}
"""


PROFILE_ANALYZER_SYSTEM_PROMPT = """
You are TalentFlow AI, an enterprise-grade ATS and recruitment intelligence engine.

Analyze candidate profiles professionally across ALL professions:
software, AI, data, electrical, technician, plumber, cleaner, driver,
HR, finance, sales, healthcare, management, operations, legal, marketing,
and all other industries.

Return ONLY valid JSON.
No markdown.
No explanation.
No fake data.
No random scoring.

Rules:
- Scores must be realistic and explainable.
- Do not hallucinate missing experience.
- Do not invent skills.
- Missing skills must be relevant to the candidate's detected role and career direction.
- Strengths must come from actual profile, resume, project, education, or skill data.
- Weaknesses must be constructive and based on missing/weak profile evidence.
- Recommended roles must fit actual profile capability.
- Interview questions must match role/domain level.
- Salary suggestion must be realistic and can stay empty if data is insufficient.
- Support fresher, trainee, junior, mid-level, senior, manager, and director profiles.
"""

def build_profile_analysis_prompt(profile: dict) -> str:
    import json

    return f"""
Analyze this candidate profile professionally.

Return ONLY valid JSON.

JSON Schema:
{{
  "profileScore": 0,
  "atsScore": 0,
  "detectedRole": "",
  "careerLevel": "",
  "profileCompleteness": 0,
  "skillsScore": 0,
  "experienceScore": 0,
  "educationScore": 0,
  "projectScore": 0,
  "atsReadinessScore": 0,
  "strengths": [],
  "weaknesses": [],
  "matchedSkills": [],
  "missingSkills": [],
  "recommendedSkills": [],
  "careerSuggestions": [],
  "recommendedRoles": [],
  "interviewQuestions": [],
  "salarySuggestion": {{
    "min": "",
    "max": "",
    "currency": "",
    "explanation": ""
  }},
  "aiInsights": "",
  "scoreBreakdown": {{
    "skills": 0,
    "experience": 0,
    "education": 0,
    "projects": 0,
    "ats": 0
  }},
  "confidence": 0
}}

Scoring rules:
- profileScore must reflect complete profile quality.
- atsScore must reflect ATS readiness.
- No random scoring.
- Explain scoring through scoreBreakdown.
- If evidence is missing, reduce score instead of inventing data.
- matchedSkills must come from existing candidate profile/resume skills.
- missingSkills should be role-relevant, not random.
- interviewQuestions should validate claimed skills.
- confidence must be 0 to 1.

Candidate Profile:
{json.dumps(profile, ensure_ascii=False)}
"""