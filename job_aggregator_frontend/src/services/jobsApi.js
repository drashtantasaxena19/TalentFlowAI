import api from "./api";

export const getRecommendedJobs = async (
    limit
) => {
    const response = await api.get(
        "/jobs/",
        {
            params: limit
                ? { limit }
                : {},
        }
    );

    return response.data;
};

export const startJobsPrefetch =
    async () => {
        const res = await api.post(
            "/jobs/prefetch"
        );

        return res.data;
    };

export const getPrefetchJobsResult =
    async () => {
        const res = await api.get(
            "/jobs/prefetch-result"
        );

        return res.data;
    };

export const getCachedRecommendations =
    async () => {
        const res = await api.get(
            "/jobs/prefetch-result"
        );

        return res.data;
    };

export const clearPrefetchJobs =
    async () => {
        const res = await api.delete(
            "/jobs/prefetch-clear"
        );

        return res.data;
    };


export const saveJob = async (
    jobData
) => {
    const response = await api.post(
        "/saved-jobs/save",
        jobData
    );

    return response.data;
};

export const getSavedJobs =
    async () => {
        const response = await api.get(
            "/saved-jobs/"
        );

        return response.data;
    };

export const removeSavedJob =
    async (applyLink) => {
        const response =
            await api.delete(
                "/saved-jobs/remove",
                {
                    params: {
                        applyLink,
                    },
                }
            );

        return response.data;
    };


export const applyToJob =
    async (payload) => {
        const res = await api.post(
            "/applications/apply",
            payload
        );

        return res.data;
    };

export const getMyApplications =
    async () => {
        const res = await api.get(
            "/applications/my"
        );

        return res.data;
    };

export const checkAppliedJob =
    async (jobId) => {
        const res = await api.get(
            `/applications/check/${encodeURIComponent(
                jobId
            )}`
        );

        return res.data;
    };

export const searchCandidateJobs =
    async (
        query = "",
        limit = 100
    ) => {
        const res = await api.get(
            "/candidate/jobs/search",
            {
                params: {
                    q: query,
                    limit,
                },
            }
        );

        return res.data;
    };

export const refreshAIRecommendations =
    async () => {
        await startJobsPrefetch();

        return await getPrefetchJobsResult();
    };


export const getPublicJobs = async (params = {}) => {
    const res = await api.get("/jobs/public", { params });
    return res.data;
};