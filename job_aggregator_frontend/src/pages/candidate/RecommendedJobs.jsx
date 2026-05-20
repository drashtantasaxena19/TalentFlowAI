import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import JobCard from "../../components/candidate/JobCard";
import Loader from "../../components/common/Loader";
import { RefreshCcw, Crown, Search, X, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

import {
  saveJob,
  getSavedJobs,
  removeSavedJob,
  startJobsPrefetch,
  getPrefetchJobsResult,
  searchCandidateJobs,
  getMyApplications,
} from "../../services/jobsApi";

import { getCurrentSubscription } from "../../services/subscriptionApi";

const JOB_CACHE_KEY = "talentflow_recommended_jobs_cache";

export default function RecommendedJobs() {
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);

  const [detectedRole, setDetectedRole] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  const [status, setStatus] = useState("loading");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  const getUserCacheKey = () =>
    user?.email ? `${JOB_CACHE_KEY}_${user.email}` : JOB_CACHE_KEY;

  const normalizeLink = (value) => {
    const link = String(value || "").trim();
    if (!link) return "";

    const fixed = link.replace(/^hhttps:\/\//i, "https://");

    if (fixed.startsWith("http://") || fixed.startsWith("https://")) {
      return fixed;
    }

    return `https://${fixed.replace(/^https?:\/\//i, "")}`;
  };

  const getJobLink = (job) =>
    normalizeLink(
      job?.applyLink ||
        job?.applicationLink ||
        job?.applicationUrl ||
        job?.applyUrl ||
        job?.apply_url ||
        job?.application_url ||
        job?.link ||
        job?.url ||
        ""
    );

  const getJobId = (job) =>
    String(
      job?._id ||
        job?.id ||
        job?.jobId ||
        job?.link ||
        job?.applyLink ||
        `${job?.title || "job"}-${job?.company || "company"}`
    );

  const isJobApplied = (job) => {
    const currentJobId = getJobId(job);
    const currentLink = getJobLink(job);

    return appliedJobs.some((app) => {
      const appJobId = String(app.jobId || app._id || "");
      const appLink = normalizeLink(app.applyLink || "");

      return (
        (currentJobId && appJobId && currentJobId === appJobId) ||
        (currentLink && appLink && currentLink === appLink)
      );
    });
  };

  const extractDetectedRole = (rawRole) => {
    if (!rawRole) return "";
    if (typeof rawRole === "string") return rawRole;

    if (typeof rawRole === "object") {
      return (
        rawRole.target_role ||
        rawRole.role ||
        rawRole.detected_role ||
        rawRole.name ||
        rawRole.title ||
        ""
      );
    }

    return "";
  };

  const extractMatchScore = (job) => {
    const rawScore =
      job.score ??
      job.match_score ??
      job.final_score ??
      job.similarity_score ??
      job.ai_match_score ??
      job.match ??
      0;

    let score = Number(String(rawScore).replace("%", ""));
    if (Number.isNaN(score)) score = 0;
    if (score > 0 && score <= 1) score *= 100;

    return Math.max(0, Math.min(100, score));
  };

  const normalizeJob = (job) => {
    const score = extractMatchScore(job);
    const link = getJobLink(job);

    return {
      ...job,
      _id: job._id || job.id || "",
      id: job.id || job._id || "",
      jobId: job.jobId || job._id || job.id || job.link || link || "",

      title: job.title || job.jobTitle || "Untitled Job",
      company: job.company || "Company not specified",
      location: job.location || "Not specified",
      salary: job.salary || "Not disclosed",
      experience: job.experience || job.jobExperience || "",

      match: score ? `${Math.round(score)}%` : job.match || "N/A",
      score: Math.round(score),
      matchScore: Math.round(score),

      applyLink: link,
      applicationLink: job.applicationLink || job.application_link || link,

      hrEmail: job.hrEmail || job.hr_email || "",
      hrPhone: job.hrPhone || job.hr_phone || "",
      chatLink: job.chatLink || job.chat_link || "",

      requiredSkills: job.required_skills || job.requiredSkills || job.skills || [],
      matchedSkills: job.matched_skills || job.matchedSkills || [],
      missingSkills: job.missing_skills || job.missingSkills || [],

      reason:
        job.reason ||
        job.aiReason ||
        "Recommended using AI semantic matching based on your profile.",
      learning: job.learning || [],
      careerAdvice: job.career_advice || job.careerAdvice || "",

      description: job.description || job.jobDescription || "",
      source: job.source || "TalentFlow AI",
      analysisSource: job.analysis_source || job.analysisSource || "",
    };
  };

  const formatJobsResponse = (response) => ({
    jobs: (response.jobs || []).map(normalizeJob),
    detectedRole: extractDetectedRole(response.detected_role),
    subscription: response.subscription || null,
    upgradeMessage: response.upgradeMessage || "",
    cachedAt: Date.now(),
  });

  const saveToCache = (data) => {
    sessionStorage.setItem(getUserCacheKey(), JSON.stringify(data));
  };

  const clearCache = () => {
    sessionStorage.removeItem(getUserCacheKey());
    localStorage.removeItem(getUserCacheKey());
  };

  const loadFromCache = () => {
    try {
      const cached = sessionStorage.getItem(getUserCacheKey());
      if (!cached) return false;

      const parsed = JSON.parse(cached);

      if (!parsed.jobs || parsed.jobs.length === 0) return false;

      setJobs(parsed.jobs || []);
      setDetectedRole(extractDetectedRole(parsed.detectedRole));
      setSubscription(parsed.subscription || null);
      setUpgradeMessage(parsed.upgradeMessage || "");
      setStatus("completed");
      setLoading(false);

      return true;
    } catch {
      clearCache();
      return false;
    }
  };

  const isJobSaved = (job) => {
    const currentLink = getJobLink(job);
    if (!currentLink) return false;

    return savedJobs.some((savedJob) => getJobLink(savedJob) === currentLink);
  };

  const loadSavedJobs = async () => {
    try {
      const response = await getSavedJobs();
      setSavedJobs(response.jobs || []);
    } catch {
      setSavedJobs([]);
    }
  };

  const loadAppliedJobs = async () => {
    try {
      const response = await getMyApplications();
      setAppliedJobs(response.applications || []);
    } catch {
      setAppliedJobs([]);
    }
  };

  const loadSubscription = async () => {
    try {
      const response = await getCurrentSubscription();

      setSubscription({
        plan: response.currentPlan || "free",
        currentPlan: response.currentPlan || "free",
        features: response.features || {},
        subscription: response.subscription || {},
      });
    } catch (error) {
      console.error("Subscription Error:", error);
    }
  };

  const loadPrefetchedJobs = async ({ force = false } = {}) => {
    if (!user?.email) return;

    if (!force) {
      const hasCache = loadFromCache();

      if (hasCache) {
        await Promise.all([loadSavedJobs(), loadAppliedJobs(), loadSubscription()]);
        return;
      }
    }

    try {
      setLoading(true);
      setSearchMode(false);

      const result = await getPrefetchJobsResult();

      if (result.status === "completed" && Array.isArray(result.jobs)) {
        const formatted = formatJobsResponse(result);

        setJobs(formatted.jobs);
        setDetectedRole(formatted.detectedRole);
        setSubscription(formatted.subscription);
        setUpgradeMessage(formatted.upgradeMessage);
        setStatus("completed");

        if (formatted.jobs.length > 0) {
          saveToCache(formatted);
        }

        return;
      }

      if (result.status === "queued" || result.status === "processing") {
        setStatus(result.status);
        setJobs([]);
        return;
      }

      const queued = await startJobsPrefetch();
      setStatus(queued.status || "queued");
      setJobs([]);
    } catch (error) {
      console.error("Recommendation Error:", error);
      setStatus("failed");
      setUpgradeMessage(
        error.response?.data?.detail ||
          "AI recommendations are being prepared. Please refresh again."
      );
    } finally {
      setLoading(false);
      await Promise.all([loadSavedJobs(), loadAppliedJobs(), loadSubscription()]);
    }
  };

  const handleSearchJobs = async (e) => {
    e.preventDefault();

    try {
      setIsSearching(true);
      setSearchMode(Boolean(searchQuery.trim()));

      const response = await searchCandidateJobs(searchQuery.trim(), 100);
      const finalJobs = (response.jobs || []).map(normalizeJob);

      setJobs(finalJobs);
      setStatus("completed");
    } catch (error) {
      console.error("Search Error:", error);
      setUpgradeMessage(error.response?.data?.detail || "Could not search jobs.");
    } finally {
      setIsSearching(false);
      await Promise.all([loadSavedJobs(), loadAppliedJobs()]);
    }
  };

  const handleClearSearch = async () => {
    setSearchQuery("");
    setSearchMode(false);
    await loadPrefetchedJobs({ force: true });
  };

  const handleSaveJob = async (job) => {
    try {
      const jobLink = getJobLink(job);

      if (!jobLink) {
        alert("This job does not have a valid apply link.");
        return;
      }

      if (isJobSaved(job)) {
        await removeSavedJob(jobLink);
      } else {
        await saveJob({
          ...job,
          applyLink: jobLink,
        });
      }

      await Promise.all([loadSavedJobs(), loadSubscription()]);
    } catch (error) {
      alert(error.response?.data?.detail || "Could not update saved job.");
    }
  };

  const handleApplied = async () => {
    await loadAppliedJobs();
  };

  const handleRefreshJobs = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      setSearchQuery("");
      setSearchMode(false);
      setUpgradeMessage("");

      clearCache();

      const queued = await startJobsPrefetch();

      setStatus(queued.status || "queued");
      setJobs([]);

      setTimeout(() => {
        loadPrefetchedJobs({ force: true });
      }, 2500);
    } catch (error) {
      console.error("Refresh Error:", error);
      setStatus("failed");
      setUpgradeMessage(
        error.response?.data?.detail || "Could not refresh AI recommendations."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPrefetchedJobs({ force: false });
  }, [user?.email]);

  useEffect(() => {
    if (status !== "queued" && status !== "processing") return;

    const timer = setInterval(() => {
      loadPrefetchedJobs({ force: true });
    }, 4000);

    return () => clearInterval(timer);
  }, [status, user?.email]);

  return (
    <DashboardLayout role="candidate">
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/20 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="text-cyan-400" size={20} />
                <p className="text-cyan-400 font-semibold uppercase tracking-wider text-sm">
                  AI Recommendation Engine
                </p>
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-white">
                Recommended Jobs
              </h1>

              <p className="text-slate-400 mt-3 max-w-3xl">
                AI-powered recommendations based on your profile, resume, skills,
                and experience.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-5">
                {detectedRole && (
                  <div className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 text-cyan-300 text-sm">
                    Detected Role:{" "}
                    <span className="font-semibold">{detectedRole}</span>
                  </div>
                )}

                {subscription?.plan && (
                  <div className="rounded-full bg-violet-500/10 border border-violet-500/20 px-4 py-2 text-violet-300 text-sm">
                    Plan:{" "}
                    <span className="font-semibold uppercase">
                      {subscription.plan}
                    </span>
                  </div>
                )}

                <div className="rounded-full bg-slate-800/70 border border-slate-700 px-4 py-2 text-slate-300 text-sm">
                  Jobs: <span className="font-semibold">{jobs.length}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefreshJobs}
              disabled={refreshing || status === "queued" || status === "processing"}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold px-6 py-4 transition"
            >
              <RefreshCcw
                size={18}
                className={
                  refreshing || status === "queued" || status === "processing"
                    ? "animate-spin"
                    : ""
                }
              />
              {refreshing || status === "queued" || status === "processing"
                ? "Preparing AI Jobs..."
                : "Refresh AI Jobs"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchJobs} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />

            <input
              type="text"
              placeholder="Search jobs, skills, companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl bg-slate-900 border border-slate-800 text-white pl-12 pr-4 py-4 outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white px-6 py-4 font-bold transition"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>

          {searchMode && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="rounded-2xl border border-slate-700 px-5 py-4 text-slate-300 hover:bg-slate-800 transition flex items-center justify-center"
            >
              <X size={18} />
            </button>
          )}
        </form>

        {(status === "queued" || status === "processing") && (
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-6 text-center">
            <Loader />
            <p className="text-cyan-300 mt-4 font-semibold">
              AI recommendations are being generated...
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Page will update automatically after worker completes.
            </p>
          </div>
        )}

        {status === "failed" && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">
            {upgradeMessage || "Could not load AI recommendations."}
          </div>
        )}

        {status === "completed" && jobs.length > 0 && (
          <div className="grid grid-cols-1 gap-6">
            {jobs.map((job, index) => (
              <JobCard
                key={getJobId(job) || index}
                job={job}
                isSaved={isJobSaved(job)}
                applied={isJobApplied(job)}
                onSave={() => handleSaveJob(job)}
                onApplied={handleApplied}
              />
            ))}
          </div>
        )}

        {status === "completed" && jobs.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h3 className="text-xl font-semibold text-white">No jobs found</h3>
            <p className="text-slate-400 mt-2">
              Click Refresh AI Jobs or try another search.
            </p>
          </div>
        )}

        {upgradeMessage && status !== "failed" && (
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5 flex items-start gap-3">
            <Crown className="text-yellow-400 mt-1" />
            <div>
              <h4 className="text-yellow-300 font-semibold">Note</h4>
              <p className="text-yellow-100/80 text-sm mt-1">{upgradeMessage}</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}