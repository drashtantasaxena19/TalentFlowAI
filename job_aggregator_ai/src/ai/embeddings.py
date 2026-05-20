import os
import numpy as np

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL",
    "sentence-transformers/all-MiniLM-L6-v2",
)

EMBEDDING_NORMALIZE = (
    os.getenv("EMBEDDING_NORMALIZE", "true").lower() == "true"
)

EMBEDDING_DIMENSION = int(
    os.getenv("EMBEDDING_DIMENSION", "384")
)

print(f"🚀 Loading Embedding Model: {MODEL_NAME}")

try:
    model = SentenceTransformer(MODEL_NAME)
    print("✅ Embedding Model Loaded")
except Exception as error:
    print("❌ Embedding Model Load Failed:", str(error))
    model = None


def clean_text(text: str):
    if not text:
        return ""

    return (
        str(text)
        .replace("\n", " ")
        .replace("\r", " ")
        .replace("\t", " ")
        .strip()
    )


def zero_embedding():
    return np.zeros(EMBEDDING_DIMENSION)


def get_embedding(text: str):
    try:
        cleaned = clean_text(text)

        if not cleaned or model is None:
            return zero_embedding()

        embedding = model.encode(
            cleaned,
            convert_to_numpy=True,
            normalize_embeddings=EMBEDDING_NORMALIZE,
        )

        return embedding

    except Exception as error:
        print("❌ Embedding Error:", str(error))
        return zero_embedding()


def get_embeddings(texts: list):
    try:
        cleaned = [clean_text(text) for text in texts if clean_text(text)]

        if not cleaned or model is None:
            return []

        embeddings = model.encode(
            cleaned,
            convert_to_numpy=True,
            normalize_embeddings=EMBEDDING_NORMALIZE,
        )

        return embeddings

    except Exception as error:
        print("❌ Batch Embedding Error:", str(error))
        return []


def get_similarity(emb1, emb2):
    try:
        similarity = cosine_similarity([emb1], [emb2])[0][0]
        similarity = float(similarity)

        return max(0.0, min(1.0, similarity))

    except Exception as error:
        print("❌ Similarity Error:", str(error))
        return 0.0


def get_bulk_similarity(user_embedding, job_embeddings):
    try:
        if not job_embeddings:
            return []

        similarities = cosine_similarity(
            np.array([user_embedding]),
            np.array(job_embeddings),
        )[0]

        return [
            max(0.0, min(1.0, float(score)))
            for score in similarities
        ]

    except Exception as error:
        print("❌ Bulk Similarity Error:", str(error))
        return []


def build_role_embedding(role: str, skills: list):
    text = f"""
Role:
{role}

Skills:
{' '.join(skills or [])}
"""

    return get_embedding(text)


def build_profile_embedding(profile: dict):
    skills = profile.get("skills", [])

    if isinstance(skills, list):
        skills_text = " ".join(skills)
    else:
        skills_text = str(skills or "")

    text = f"""
Role:
{profile.get("role", "")}

Summary:
{profile.get("summary", "")}

Experience:
{profile.get("experience", "")}

Education:
{profile.get("education", "")}

Skills:
{skills_text}

Resume:
{str(profile.get("resume_text", ""))[:3000]}
"""

    return get_embedding(text)