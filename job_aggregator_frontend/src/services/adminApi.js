import api from "./api";

export const getAdminDashboard = async () => {
    const res = await api.get("/admin/dashboard");
    return res.data;
};

export const getAdminUsers = async ({ role = "all", search = "" } = {}) => {
    const res = await api.get("/admin/users", {
        params: { role, search },
    });
    return res.data;
};

export const createAdminUser = async (payload) => {
    const res = await api.post("/admin/users/create-admin", payload);
    return res.data;
};

export const updateAdminUserStatus = async (email, isActive) => {
    const res = await api.patch(`/admin/users/${encodeURIComponent(email)}/status`, {
        isActive,
    });
    return res.data;
};

export const deleteAdminUser = async (email) => {
    const res = await api.delete(`/admin/users/${encodeURIComponent(email)}`);
    return res.data;
};

export const getAdminCompanies = async ({
    search = "",
    status = "all",
} = {}) => {
    const res = await api.get("/admin/companies", {
        params: {
            search,
            status_filter: status,
        },
    });
    return res.data;
};

export const updateCompanyVerification = async (employerEmail, status) => {
    const res = await api.patch(
        `/admin/companies/${encodeURIComponent(employerEmail)}/verification`,
        { status }
    );

    return res.data;
};

export const getAdminJobs = async ({
    search = "",
    status = "all",
} = {}) => {
    const res = await api.get("/admin/jobs", {
        params: {
            search,
            status_filter: status,
        },
    });

    return res.data;
};

export const moderateAdminJob = async (jobId, action) => {
    const res = await api.patch(`/admin/jobs/${jobId}/moderate`, {
        action,
    });

    return res.data;
};

export const deleteAdminJob = async (jobId) => {
    const res = await api.delete(`/admin/jobs/${jobId}`);
    return res.data;
};

export const getAdminPayments = async ({
    search = "",
    role = "all",
} = {}) => {
    const res = await api.get("/admin/payments", {
        params: {
            search,
            role,
        },
    });

    return res.data;
};

export const getAdminSettings = async () => {
    const res = await api.get("/admin/settings");
    return res.data;
};

export const updateAdminSettings = async (payload) => {
    const res = await api.put("/admin/settings", payload);
    return res.data;
};