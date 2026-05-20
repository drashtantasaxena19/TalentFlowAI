import re

def normalize_skill(skill: str):
    return (
        str(skill or "")
        .strip()
        .lower()
    )

def unique_list(items):
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


def extract_skills(text: str):
    if not text:
        return []

    lower_text = text.lower()

    patterns = [

        # tech
        r"\bpython\b",
        r"\bjava\b",
        r"\breact\b",
        r"\bnode\b",
        r"\bmongodb\b",
        r"\bsql\b",
        r"\bmysql\b",
        r"\bpostgresql\b",
        r"\bpower bi\b",
        r"\btableau\b",
        r"\bexcel\b",
        r"\bmachine learning\b",
        r"\bdata analysis\b",
        r"\bartificial intelligence\b",

        # blue collar
        r"\belectrician\b",
        r"\bplumber\b",
        r"\bmechanic\b",
        r"\bdriver\b",
        r"\bwelder\b",
        r"\bcarpenter\b",
        r"\btechnician\b",
        r"\bhelper\b",
        r"\boperator\b",
        r"\bfitter\b",
        r"\bsweeper\b",

        # aviation / airport
        r"\bground staff\b",
        r"\bcabin crew\b",
        r"\baviation\b",
        r"\bairport\b",

        # management
        r"\bmanager\b",
        r"\bdirector\b",
        r"\bhr\b",
        r"\bmarketing\b",
        r"\bsales\b",

        # healthcare
        r"\bnurse\b",
        r"\bdoctor\b",
        r"\bpharmacist\b",

        # education
        r"\bteacher\b",
        r"\btrainer\b",

        # logistics
        r"\bwarehouse\b",
        r"\bdelivery\b",

        # finance
        r"\baccountant\b",
        r"\bfinance\b",
        r"\bbanking\b",
    ]

    found_skills = []

    for pattern in patterns:
        matches = re.findall(
            pattern,
            lower_text,
            re.I,
        )

        for match in matches:
            skill = (
                str(match)
                .strip()
                .title()
            )

            if skill:
                found_skills.append(
                    skill
                )

    dynamic_patterns = re.findall(
        r"\b[a-zA-Z][a-zA-Z\-\+#/.]{2,}\b",
        text,
    )

    for word in dynamic_patterns:
        cleaned = word.strip()

        if (
            len(cleaned) >= 3 and
            cleaned.lower()
            not in STOPWORDS
        ):
            found_skills.append(
                cleaned
            )

    return unique_list(
        found_skills
    )

def get_missing_skills(
    user_skills,
    required_skills,
):
    user_map = {
        normalize_skill(skill)
        for skill in user_skills
    }

    missing = []

    for skill in required_skills:
        if (
            normalize_skill(skill)
            not in user_map
        ):
            missing.append(skill)

    return unique_list(
        missing
    )

STOPWORDS = {
    "and",
    "the",
    "for",
    "with",
    "job",
    "role",
    "work",
    "good",
    "best",
    "team",
    "candidate",
    "required",
    "skills",
    "knowledge",
    "experience",
    "year",
    "years",
    "ability",
    "must",
    "need",
    "using",
    "responsible",
    "management",
    "company",
    "office",
    "staff",
    "employee",
    "service",
    "services",
    "development",
    "support",
    "working",
    "maintenance",
    "project",
    "projects",
}