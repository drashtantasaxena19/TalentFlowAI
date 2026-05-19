def clamp_score(score: float) -> float:
    return round(max(0, min(100, float(score))), 2)


def calculate_score(embedding_score: float, ai_result=None) -> float:
    """
    embedding_score comes from cosine similarity: 0 to 1
    ai match_score should be: 0 to 100
    Final score should also be: 0 to 100
    """

    embedding_percentage = clamp_score(embedding_score * 100)

    if ai_result:
        ai_score = ai_result.get("match_score", 0)
        ai_score = clamp_score(ai_score)

        return clamp_score(
            embedding_percentage * 0.35 +
            ai_score * 0.65
        )

    return embedding_percentage