from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer("all-MiniLM-L6-v2")


def get_embedding(text):
    return model.encode(text, convert_to_tensor=True)


def get_embeddings(text_list):
    return model.encode(text_list, convert_to_tensor=True)


def get_similarity(user_embedding, job_embeddings):
    return util.cos_sim(user_embedding, job_embeddings)[0]