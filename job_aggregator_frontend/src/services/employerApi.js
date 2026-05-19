import api from "./api";

export const getEmployerDashboard = async () => {
    const res = await api.get("/employer/dashboard");
    return res.data;
};

export const getCompanyProfile = async () => {
    const res = await api.get("/employer/company-profile");
    return res.data;
};

export const saveCompanyProfile = async (payload) => {
    const res = await api.post("/employer/company-profile", payload);
    return res.data;
};

export const getEmployerJobs = async () => {
    const res = await api.get("/employer/jobs");
    return res.data;
};

export const postEmployerJob = async (payload) => {
    const res = await api.post("/employer/jobs", payload);
    return res.data;
};

export const updateEmployerJob = async (jobId, payload) => {
    const res = await api.put(`/employer/jobs/${jobId}`, payload);
    return res.data;
};

export const deleteEmployerJob = async (jobId) => {
    const res = await api.delete(`/employer/jobs/${jobId}`);
    return res.data;
};

export const getEmployerApplicants = async () => {
    const res = await api.get("/employer/applicants");
    return res.data;
};

export const updateApplicantStatus = async (applicationId, status) => {
    const res = await api.put(`/employer/applicants/${applicationId}/status`, {
        status,
    });
    return res.data;
};

export const rankCandidatesForJob = async (jobId) => {
    const res = await api.get(`/employer/rank-candidates/${jobId}`);
    return res.data;
};