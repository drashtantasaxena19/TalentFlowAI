import api from "./api";

export const getCurrentSubscription = async () => {
    const res = await api.get("/subscription/current");
    return res.data;
};

export const upgradeSubscription = async (plan) => {
    const res = await api.post("/subscription/upgrade", { plan });
    return res.data;
};

export const cancelSubscription = async () => {
    const res = await api.post("/subscription/cancel");
    return res.data;
};