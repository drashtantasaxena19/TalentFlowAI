from src.ai.embeddings import (
    get_embedding,
    get_similarity,
)


MIN_SEMANTIC_SIMILARITY = 0.18


def normalize(value):
    return str(value or "").strip()


def validate_skill_against_role(
    role: str,
    skill: str,
):
    role = normalize(role)
    skill = normalize(skill)

    if not role or not skill:
        return False

    role_embedding = get_embedding(role)
    skill_embedding = get_embedding(skill)

    similarity = get_similarity(
        role_embedding,
        skill_embedding,
    )

    return similarity >= MIN_SEMANTIC_SIMILARITY


def filter_semantic_skills(
    role: str,
    skills: list,
):
    valid = []
    removed = []

    for skill in skills:
        if validate_skill_against_role(
            role,
            skill,
        ):
            valid.append(skill)
        else:
            removed.append(skill)

    return {
        "valid": valid,
        "removed": removed,
    }