import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import JobCard from "../../components/candidate/JobCard";
import Loader from "../../components/common/Loader";
import { Lock, RefreshCcw, Crown, Search, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  saveJob,
  getSavedJobs,
  removeSavedJob,
  searchCandidateJobs,
  getMyApplications,
} from "../../services/jobsApi";
import { getCurrentSubscription } from "../../services/subscriptionApi";

export default function RecommendedJobs() {
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);

  const [subscription, setSubscription] = useState(null);
  const [status, setStatus] = useState("completed");
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  const normalizeLink = (value) => {
    const link = String(value || "").trim();
    if (!link) return "";
    if (link.startsWith("http://") || link.startsWith("https://")) return link;
    return `https://${link}`;
  };

  const getJobLink = (job) => {
    return normalizeLink(
      job?.applyLink ||
        job?.applicationLink ||
        job?.applicationUrl ||
        job?.applyUrl ||
        job?.apply_url ||
        job?.application_url ||
        job?.link ||
        job?.url ||
        job?.jobUrl ||
        job?.job_url
    );
  };

  const getJobId = (job) => {
    return String(
      job?._id ||
        job?.id ||
        job?.jobId ||
        job?.link ||
        job?.applyLink ||
        `${job?.title || job?.jobTitle || "job"}-${job?.company || "company"}`
    );
  };

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

  const extractMatchScore = (job) => {
    const rawScore =
      job.score ??
      job.match_score ??
      job.final_score ??
      job.similarity_score ??
      job.ai_match_score ??
      job.match ??
      job.matchScore ??
      0;

    let normalizedScore = Number(rawScore);
    if (Number.isNaN(normalizedScore)) normalizedScore = 0;
    if (normalizedScore > 0 && normalizedScore <= 1) normalizedScore *= 100;

    return Math.max(0, Math.min(100, normalizedScore));
  };

  const normalizeJob = (job) => {
    const jobLink = getJobLink(job);
    const normalizedScore = extractMatchScore(job);

    return {
      ...job,

      _id: job._id || job.id || "",
      id: job.id || job._id || "",
      jobId: job.jobId || job._id || job.id || job.link || job.applyLink || "",

      title: job.title || job.jobTitle || "Untitled Job",
      company: job.company || "Company not specified",
      location: job.location || "Not specified",
      salary: job.salary || "Not disclosed",
      experience: job.experience || job.jobExperience || "",

      jobType: job.jobType || job.job_type || "",
      workMode: job.workMode || job.work_mode || "",
      deadline: job.deadline || "",
      status: job.status || "active",

      match: normalizedScore ? `${Math.round(normalizedScore)}%` : job.match || "N/A",
      score: Math.round(normalizedScore),
      matchScore: Math.round(normalizedScore),

      applyLink: jobLink,
      applicationLink: job.applicationLink || job.application_link || jobLink,

      hrEmail: job.hrEmail || job.hr_email || "",
      hrPhone: job.hrPhone || job.hr_phone || "",
      chatLink: job.chatLink || job.chat_link || "",

      reason:
        job.reason ||
        job.aiReason ||
        job.description ||
        "Recommended based on your profile and available job data.",

      learning: job.learning || [],
      careerAdvice: job.career_advice || job.careerAdvice || "",

      skills: job.skills || job.required_skills || job.requiredSkills || [],
      requiredSkills: job.required_skills || job.requiredSkills || job.skills || [],
      matchedSkills: job.matched_skills || job.matchedSkills || [],
      missingSkills: job.missing_skills || job.missingSkills || [],

      description: job.description || job.jobDescription || "",
      requirements: job.requirements || "",
      responsibilities: job.responsibilities || "",

      employerEmail: job.employerEmail || job.employer_email || "",

      source: job.source || "",
      analysisSource: job.analysis_source || job.analysisSource || "",
    };
  };

  const isJobSaved = (job) => {
    const currentLink = getJobLink(job);
    if (!currentLink || currentLink === "#") return false;

    return savedJobs.some((savedJob) => {
      const savedLink = getJobLink(savedJob);
      return savedLink && savedLink !== "#" && savedLink === currentLink;
    });
  };

  const loadSavedJobs = async () => {
    try {
      const response = await getSavedJobs();
      setSavedJobs(response.jobs || []);
    } catch (error) {
      console.error("Saved Jobs Error:", error);
      setSavedJobs([]);
    }
  };

  const loadAppliedJobs = async () => {
    try {
      const response = await getMyApplications();
      setAppliedJobs(response.applications || []);
    } catch (error) {
      console.error("Applied Jobs Error:", error);
      setAppliedJobs([]);
    }
  };

  const loadSubscription = async () => {
    try {
      const response = await getCurrentSubscription();

      setSubscription((previous) => ({
        ...(previous || {}),
        plan: response.currentPlan || previous?.plan || "free",
        currentPlan: response.currentPlan || previous?.currentPlan || "free",
        features: response.features || previous?.features || {},
        subscription: response.subscription || previous?.subscription || {},
      }));
    } catch (error) {
      console.error("Subscription Error:", error);
    }
  };

  const loadInitialData = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      setStatus("completed");

      await Promise.all([
        loadSavedJobs(),
        loadAppliedJobs(),
        loadSubscription(),
      ]);

      setJobs([]);
    } catch (error) {
      console.error("Recommended Jobs Initial Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchJobs = async (e) => {
    e.preventDefault();

    const query = searchQuery.trim();

    try {
      setIsSearching(true);
      setLoading(false);
      setSearchMode(Boolean(query));

      const response = await searchCandidateJobs(query, 100);
      const finalJobs = (response.jobs || []).map(normalizeJob);

      setJobs(finalJobs);
      setStatus("completed");
    } catch (error) {
      console.error("Search Jobs Error:", error);
      alert(error.response?.data?.detail || "Could not search jobs");
    } finally {
      setIsSearching(false);
      await Promise.all([loadSavedJobs(), loadAppliedJobs()]);
    }
  };

  const handleClearSearch = async () => {
    setSearchQuery("");
    setSearchMode(false);
    setJobs([]);
    await Promise.all([loadSavedJobs(), loadAppliedJobs(), loadSubscription()]);
  };

  const handleSaveJob = async (job) => {
    const jobLink = getJobLink(job);

    if (!jobLink || jobLink === "#") {
      alert("This job does not have a valid apply link, so it cannot be saved.");
      return;
    }

    try {
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
      alert(error.response?.data?.detail || "Could not update saved job");
    }
  };

  const handleApplied = async () => {
    await loadAppliedJobs();
  };

  const handleRefreshJobs = async () => {
    setSearchQuery("");
    setSearchMode(false);
    setJobs([]);
    await Promise.all([loadSavedJobs(), loadAppliedJobs(), loadSubscription()]);
    alert("AI prefetch is temporarily disabled on the production server. Use search to view jobs.");
  };

  useEffect(() => {
    loadInitialData();
  }, [user?.email]);

  const currentPlan =
    subscription?.plan ||
    subscription?.currentPlan ||
    subscription?.subscription?.plan ||
    "free";

  const planLimit =
    subscription?.limit ?? subscription?.features?.recommended_jobs_limit ?? 10;

  const isUnlimited = planLimit === -1 || planLimit === null;
  const isPreparing = status === "queued" || status === "processing";

  return (
    <DashboardLayout role="candidate">
      <section className="mb-8">
        <div className="rounded-[2rem] border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 p-6 md:p-8">
          <p className="text-violet-300 font-semibold uppercase tracking-wider">
            Smart Job Search
          </p>

          <h1 className="text-3xl md:text-5xl font-extrabold mt-3">
            Recommended
            <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              Jobs For You
            </span>
          </h1>

          <p className="text-slate-300 mt-4 max-w-2xl">
            Search jobs from your live database. AI prefetch is temporarily disabled on the free production server.
          </p>
        </div>
      </section>

      <section className="mb-6">
        <form
          onSubmit={handleSearchJobs}
          className="rounded-[2rem] bg-slate-900/70 border border-violet-500/20 p-4 flex flex-col lg:flex-row gap-3"
        >
          <div className="flex-1 flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">
            <Search size={20} className="text-violet-300" />

            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs by role, company, skills, location..."
              className="w-full bg-transparent outline-none text-white placeholder:text-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 text-slate-950 font-bold hover:scale-[1.01] transition"
          >
            {isSearching ? "Searching..." : "Search DB Jobs"}
          </button>

          {searchMode && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-5 py-3 rounded-2xl border border-slate-700 text-slate-300 hover:border-red-400 hover:text-red-300 transition flex items-center justify-center gap-2"
            >
              <X size={18} />
              Clear
            </button>
          )}
        </form>
      </section>

      <section className="mb-8">
        <div className="rounded-[2rem] bg-slate-900/70 border border-violet-500/20 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            {currentPlan === "free" ? (
              <Lock className="text-fuchsia-300" size={24} />
            ) : (
              <Crown className="text-fuchsia-300" size={24} />
            )}

            <div>
              <p className="text-slate-300 font-semibold capitalize">
                {searchMode ? "Database Search" : `${currentPlan} Plan`}
              </p>

              <p className="text-slate-400 text-sm">
                {searchMode
                  ? `Showing database jobs for "${searchQuery}"`
                  : isUnlimited
                  ? "Unlimited premium recommendations enabled."
                  : `Search jobs manually. Current plan recommendation limit: ${planLimit}.`}
              </p>
            </div>
          </div>

          <button
            onClick={handleRefreshJobs}
            className="px-6 py-3 rounded-2xl border border-violet-400 text-violet-300 font-bold hover:bg-violet-400 hover:text-slate-950 transition flex items-center gap-2"
          >
            <RefreshCcw size={18} />
            Refresh Jobs
          </button>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[2rem] bg-slate-900/70 border border-violet-500/20 p-8">
          <Loader text="Loading jobs data..." />
        </div>
      ) : isPreparing && !searchMode ? (
        <div className="rounded-[2rem] bg-slate-900/70 border border-violet-500/20 p-8 text-center">
          <Loader text="Preparing jobs..." />
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-[2rem] bg-slate-900/70 border border-violet-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold">No jobs shown yet</h2>

          <p className="text-slate-400 mt-2">
            Search jobs by role, company, skills, or location to view database jobs.
          </p>
        </div>
      ) : (
        <section className="grid gap-6">
          {jobs.map((job, index) => (
            <JobCard
              key={`${job._id || job.applyLink || job.title}-${job.company}-${index}`}
              job={job}
              isSaved={isJobSaved(job)}
              applied={isJobApplied(job)}
              onApplied={handleApplied}
              onSave={() => handleSaveJob(job)}
            />
          ))}
        </section>
      )}
    </DashboardLayout>
  );
}