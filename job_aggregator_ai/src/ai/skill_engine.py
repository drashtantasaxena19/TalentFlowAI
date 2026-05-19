SKILL_KEYWORDS = {
    "Python": ["python"],
    "Java": ["java"],
    "JavaScript": ["javascript", " js "],
    "TypeScript": ["typescript"],
    "HTML": ["html"],
    "CSS": ["css"],
    "React.js": ["react", "react.js", "reactjs"],
    "Node.js": ["node.js", "nodejs", " node "],
    "Express.js": ["express", "express.js"],
    "MongoDB": ["mongodb", "mongo db"],
    "MySQL": ["mysql"],
    "PostgreSQL": ["postgresql", "postgres"],
    "SQL": ["sql"],
    "FastAPI": ["fastapi"],
    "Django": ["django"],
    "Flask": ["flask"],
    "REST API": ["rest api", "restful api"],
    "Machine Learning": ["machine learning", " ml "],
    "Deep Learning": ["deep learning"],
    "Artificial Intelligence": ["artificial intelligence", " ai "],
    "NLP": ["nlp", "natural language processing"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "Scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
    "TensorFlow": ["tensorflow"],
    "PyTorch": ["pytorch"],
    "Power BI": ["power bi", "powerbi"],
    "Tableau": ["tableau"],
    "Excel": ["excel", "ms excel"],
    "Git": [" git ", "git,"],
    "GitHub": ["github"],
    "Docker": ["docker"],
    "AWS": ["aws", "amazon web services"],
    "Web Scraping": ["web scraping", "scraping"],
    "Playwright": ["playwright"],
    "BeautifulSoup": ["beautifulsoup", "beautiful soup", "bs4"],
}


def normalize(text: str) -> str:
    return f" {(text or '').lower()} "


def extract_skills(text: str):
    lower = normalize(text)
    skills = []

    for skill, patterns in SKILL_KEYWORDS.items():
        if any(pattern.lower() in lower for pattern in patterns):
            skills.append(skill)

    return sorted(set(skills))


def get_missing_skills(user_skills, job_text):
    job_skills = extract_skills(job_text)

    user_normalized = {
        str(skill).strip().lower()
        for skill in user_skills
        if str(skill).strip()
    }

    missing = []

    for skill in job_skills:
        if skill.lower() not in user_normalized:
            missing.append(skill)

    return missing[:8]