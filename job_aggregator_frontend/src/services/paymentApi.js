import api from "./api";

export const createSubscriptionOrder = async (plan) => {
    const res = await api.post("/payments/create-order", { plan });
    return res.data;
};

export const verifySubscriptionPayment = async ({
    plan,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
}) => {
    const res = await api.post("/payments/verify", {
        plan,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
    });

    return res.data;
};

export const getPaymentHistory = async () => {
    const res = await api.get("/payments/history");
    return res.data;
};