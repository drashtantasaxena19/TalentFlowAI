import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import {
    getEmployerDashboard,
    getEmployerApplicants,
    getEmployerJobs,
    getCompanyProfile,
} from "../services/employerApi";
import { getCurrentSubscription } from "../services/subscriptionApi";

const EmployerDataContext = createContext(null);
const CACHE_PREFIX = "talentflow_employer_cache_v4";

const emptyLoaded = {
    dashboard: false,
    applicants: false,
    jobs: false,
    companyProfile: false,
    subscription: false,
};

const emptyLoading = {
    dashboard: false,
    applicants: false,
    jobs: false,
    companyProfile: false,
    subscription: false,
};

const emptyError = {
    dashboard: "",
    applicants: "",
    jobs: "",
    companyProfile: "",
    subscription: "",
};

export function EmployerDataProvider({ children }) {
    const { user } = useAuth();

    const userKey = user?.email || user?._id || user?.id || "";
    const userCacheKey = userKey ? `${CACHE_PREFIX}_${userKey}` : null;

    const [dashboard, setDashboard] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [applicantStats, setApplicantStats] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [companyProfile, setCompanyProfile] = useState(null);
    const [subscription, setSubscription] = useState(null);

    const [loaded, setLoaded] = useState(emptyLoaded);
    const [loading, setLoading] = useState(emptyLoading);
    const [error, setError] = useState(emptyError);

    const resetEmployerState = () => {
        setDashboard(null);
        setApplicants([]);
        setApplicantStats(null);
        setJobs([]);
        setCompanyProfile(null);
        setSubscription(null);
        setLoaded(emptyLoaded);
        setLoading(emptyLoading);
        setError(emptyError);
    };

    const clearAllEmployerCaches = () => {
        Object.keys(sessionStorage).forEach((key) => {
            if (key.startsWith("talentflow_employer_cache")) {
                sessionStorage.removeItem(key);
            }
        });
    };

    useEffect(() => {
        resetEmployerState();
        clearAllEmployerCaches();
    }, [userKey]);

    const setPartLoading = (key, value) => {
        setLoading((prev) => ({ ...prev, [key]: value }));
    };

    const setPartError = (key, value) => {
        setError((prev) => ({ ...prev, [key]: value }));
    };

    const saveCache = (nextData = {}) => {
        if (!userCacheKey || !userKey) return;

        try {
            const payload = {
                dashboard,
                applicants,
                applicantStats,
                jobs,
                companyProfile,
                subscription,
                loaded,
                userKey,
                ...nextData,
                cachedAt: Date.now(),
            };

            sessionStorage.setItem(userCacheKey, JSON.stringify(payload));
        } catch (err) {
            console.error("Employer cache save failed:", err);
        }
    };

    const loadCache = () => {
        if (!userCacheKey || !userKey) return null;

        try {
            const cached = sessionStorage.getItem(userCacheKey);
            if (!cached) return null;

            const data = JSON.parse(cached);

            if (data.userKey !== userKey) {
                sessionStorage.removeItem(userCacheKey);
                return null;
            }

            setDashboard(data.dashboard || null);
            setApplicants(data.applicants || []);
            setApplicantStats(data.applicantStats || null);
            setJobs(data.jobs || []);
            setCompanyProfile(data.companyProfile || null);
            setSubscription(data.subscription || null);
            setLoaded(data.loaded || emptyLoaded);

            return data;
        } catch (err) {
            console.error("Employer cache load failed:", err);
            sessionStorage.removeItem(userCacheKey);
            return null;
        }
    };

    const refreshDashboard = async ({ force = false } = {}) => {
        if (!userKey) return null;

        if (!force && loaded.dashboard && dashboard) return dashboard;

        if (!force) {
            const cached = loadCache();
            if (cached?.loaded?.dashboard) return cached.dashboard || null;
        }

        try {
            setPartLoading("dashboard", true);
            setPartError("dashboard", "");

            const res = await getEmployerDashboard();
            const nextLoaded = { ...loaded, dashboard: true };

            setDashboard(res);
            setLoaded(nextLoaded);
            saveCache({ dashboard: res, loaded: nextLoaded, userKey });

            return res;
        } catch (err) {
            setPartError(
                "dashboard",
                err?.response?.data?.detail || "Failed to load dashboard"
            );
            return null;
        } finally {
            setPartLoading("dashboard", false);
        }
    };

    const refreshApplicants = async ({ force = false } = {}) => {
        if (!userKey) return null;

        if (!force && loaded.applicants) {
            return { applicants, stats: applicantStats };
        }

        if (!force) {
            const cached = loadCache();
            if (cached?.loaded?.applicants) {
                return {
                    applicants: cached.applicants || [],
                    stats: cached.applicantStats || null,
                };
            }
        }

        try {
            setPartLoading("applicants", true);
            setPartError("applicants", "");

            const res = await getEmployerApplicants();
            const nextApplicants = res?.applicants || [];
            const nextStats = res?.stats || {
                totalApplicants: 0,
                shortlisted: 0,
                pendingReview: 0,
                strongMatches: 0,
            };

            const nextLoaded = { ...loaded, applicants: true };

            setApplicants(nextApplicants);
            setApplicantStats(nextStats);
            setLoaded(nextLoaded);

            saveCache({
                applicants: nextApplicants,
                applicantStats: nextStats,
                loaded: nextLoaded,
                userKey,
            });

            return { applicants: nextApplicants, stats: nextStats };
        } catch (err) {
            setPartError(
                "applicants",
                err?.response?.data?.detail || "Failed to load applicants"
            );
            return null;
        } finally {
            setPartLoading("applicants", false);
        }
    };

    const refreshJobs = async ({ force = false } = {}) => {
        if (!userKey) return [];

        if (!force && loaded.jobs) return jobs;

        if (!force) {
            const cached = loadCache();
            if (cached?.loaded?.jobs) return cached.jobs || [];
        }

        try {
            setPartLoading("jobs", true);
            setPartError("jobs", "");

            const res = await getEmployerJobs();
            const nextJobs = res?.jobs || [];
            const nextLoaded = { ...loaded, jobs: true };

            setJobs(nextJobs);
            setLoaded(nextLoaded);
            saveCache({ jobs: nextJobs, loaded: nextLoaded, userKey });

            return nextJobs;
        } catch (err) {
            setPartError(
                "jobs",
                err?.response?.data?.detail || "Failed to load jobs"
            );
            return [];
        } finally {
            setPartLoading("jobs", false);
        }
    };

    const refreshCompanyProfile = async ({ force = false } = {}) => {
        if (!userKey) return null;

        if (!force && loaded.companyProfile) return companyProfile;

        if (!force) {
            const cached = loadCache();
            if (cached?.loaded?.companyProfile) {
                return cached.companyProfile || null;
            }
        }

        try {
            setPartLoading("companyProfile", true);
            setPartError("companyProfile", "");

            const res = await getCompanyProfile();
            const profile = res?.profile || null;
            const nextLoaded = { ...loaded, companyProfile: true };

            setCompanyProfile(profile);
            setLoaded(nextLoaded);

            saveCache({
                companyProfile: profile,
                loaded: nextLoaded,
                userKey,
            });

            return profile;
        } catch (err) {
            setPartError(
                "companyProfile",
                err?.response?.data?.detail || "Failed to load company profile"
            );
            return null;
        } finally {
            setPartLoading("companyProfile", false);
        }
    };

    const refreshSubscription = async ({ force = false } = {}) => {
        if (!userKey) return null;

        if (!force && loaded.subscription) return subscription;

        if (!force) {
            const cached = loadCache();
            if (cached?.loaded?.subscription) return cached.subscription || null;
        }

        try {
            setPartLoading("subscription", true);
            setPartError("subscription", "");

            const res = await getCurrentSubscription();
            const nextLoaded = { ...loaded, subscription: true };

            setSubscription(res);
            setLoaded(nextLoaded);
            saveCache({ subscription: res, loaded: nextLoaded, userKey });

            return res;
        } catch (err) {
            setPartError(
                "subscription",
                err?.response?.data?.detail || "Failed to load subscription"
            );
            return null;
        } finally {
            setPartLoading("subscription", false);
        }
    };

    const clearEmployerCache = () => {
        if (userCacheKey) sessionStorage.removeItem(userCacheKey);
        resetEmployerState();
    };

    const activeJobsCount = useMemo(() => {
        return jobs.filter((job) => (job.status || "active") === "active").length;
    }, [jobs]);

    const value = {
        dashboard,
        applicants,
        applicantStats,
        jobs,
        companyProfile,
        subscription,
        activeJobsCount,
        loading,
        error,

        setJobs,
        setCompanyProfile,
        setSubscription,

        refreshDashboard,
        refreshApplicants,
        refreshJobs,
        refreshCompanyProfile,
        refreshSubscription,
        clearEmployerCache,
        clearAllEmployerCaches,
    };

    return (
        <EmployerDataContext.Provider value={value}>
            {children}
        </EmployerDataContext.Provider>
    );
}

export function useEmployerData() {
    const context = useContext(EmployerDataContext);

    if (!context) {
        throw new Error("useEmployerData must be used inside EmployerDataProvider");
    }

    return context;
}