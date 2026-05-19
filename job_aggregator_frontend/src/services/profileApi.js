import api from "./api";

export const getCandidateProfile = async () => {
    const res = await api.get("/candidate/profile");
    return res.data;
};

export const saveCandidateProfile = async (payload) => {
    const res = await api.post("/candidate/profile", payload);
    return res.data;
};