import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import ProfileStrength from "../../components/candidate/ProfileStrength";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../context/AuthContext";
import {
  Briefcase,
  Brain,
  Upload,
  UserCircle,
  BookmarkCheck,
  Crown,
  RefreshCcw,
  Star,
  Code2,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getCandidateProfile } from "../../services/profileApi";
import {
  getSavedJobs,
  startJobsPrefetch,
  getPrefetchJobsResult,
} from "../../services/jobsApi";
import { getCurrentSubscription } from "../../services/subscriptionApi";

const DASHBOARD_CACHE_KEY = "talentflow_candidate_dashboard_cache_queue_v1";
const JOB_CACHE_KEY = "talentflow_recommended_jobs_cache";

const emptyProfile = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  currentRole: "",
  experience: "",
  linkedin: "",
  github: "",
  portfolio: "",
  qualification: "",
  course: "",
  college: "",
  university: "",
  education: "",
  skills: "",
  summary: "",
};

export default function CandidateDashboard() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(emptyProfile);
  const [savedJobs, setSavedJobs] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [recommendedJobsCount, setRecommendedJobsCount] = useState(0);
  const [prefetchStatus, setPrefetchStatus] = useState("idle");
  const [loading, setLoading] = useState(false);

  const dashboardCacheKey = user?.email
    ? `${DASHBOARD_CACHE_KEY}_${user.email}`
    : DASHBOARD_CACHE_KEY;

  const recommendedCacheKey = user?.email
    ? `${JOB_CACHE_KEY}_${user.email}`
    : JOB_CACHE_KEY;

  const displayName =
    profile?.fullName?.trim() || user?.name?.trim() || "Candidate";

  const currentPlan = subscription?.currentPlan || "free";
  const savedLimit = subscription?.features?.saved_jobs_limit ?? 5;
  const isSavedUnlimited = savedLimit === -1;

  const profileCompletion = useMemo(() => {
    const filledFields = Object.values(profile).filter(
      (value) => String(value || "").trim() !== ""
    ).length;

    return Math.min(
      100,
      Math.round((filledFields / Object.keys(profile).length) * 100)
    );
  }, [profile]);

  const resumeScore = useMemo(() => {
    let score = 0;

    if (profile.fullName) score += 8;
    if (profile.phone) score += 8;
    if (profile.location) score += 8;
    if (profile.currentRole) score += 12;
    if (profile.experience) score += 10;
    if (profile.linkedin) score += 8;
    if (profile.github || profile.portfolio) score += 8;
    if (profile.qualification) score += 8;
    if (profile.college || profile.university) score += 8;

    if (profile.skills) {
      const skillCountValue = String(profile.skills)
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean).length;

      score += Math.min(skillCountValue * 3, 15);
    }

    if (profile.summary) score += 15;

    return Math.min(score, 100);
  }, [profile]);

  const skillCount = useMemo(() => {
    if (!profile.skills) return 0;

    return String(profile.skills)
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean).length;
  }, [profile]);

  const skillGrowth = useMemo(() => {
    if (skillCount >= 10) return "+25%";
    if (skillCount >= 7) return "+18%";
    if (skillCount >= 4) return "+12%";
    if (skillCount >= 1) return "+5%";
    return "0%";
  }, [skillCount]);

  const saveDashboardCache = (data) => {
    try {
      sessionStorage.setItem(
        dashboardCacheKey,
        JSON.stringify({
          ...data,
          cachedAt: Date.now(),
        })
      );
    } catch (error) {
      console.error("Dashboard cache save error:", error);
    }
  };

  const loadDashboardCache = () => {
    try {
      const cached = sessionStorage.getItem(dashboardCacheKey);

      if (!cached) return false;

      const parsed = JSON.parse(cached);

      setProfile(parsed.profile || emptyProfile);
      setSavedJobs(parsed.savedJobs || []);
      setSubscription(parsed.subscription || null);
      setRecommendedJobsCount(parsed.recommendedJobsCount || 0);
      setPrefetchStatus(parsed.prefetchStatus || "idle");

      return true;
    } catch (error) {
      sessionStorage.removeItem(dashboardCacheKey);
      return false;
    }
  };

  const cachePrefetchedJobs = (result) => {
    const jobs = result?.jobs || [];

    sessionStorage.setItem(
      recommendedCacheKey,
      JSON.stringify({
        jobs,
        detectedRole: result?.detected_role || null,
        subscription: result?.subscription || null,
        upgradeMessage: result?.upgradeMessage || "",
        cachedAt: Date.now(),
      })
    );

    setRecommendedJobsCount(jobs.length);
  };

  const startQueueOnly = async () => {
    if (!user?.email) return;

    try {
      const result = await getPrefetchJobsResult();

      if (result?.status === "completed") {
        cachePrefetchedJobs(result);
        setPrefetchStatus("completed");
        return;
      }

      const queued = await startJobsPrefetch();
      setPrefetchStatus(queued?.status || "queued");
    } catch (error) {
      console.error("Prefetch queue start error:", error);
      setPrefetchStatus("idle");
    }
  };

  const checkPrefetchStatusLight = async () => {
    try {
      const result = await getPrefetchJobsResult();

      if (result?.status === "completed") {
        cachePrefetchedJobs(result);
        setPrefetchStatus("completed");
        return;
      }

      setPrefetchStatus(result?.status || "not_started");
    } catch (error) {
      console.error("Prefetch status check error:", error);
    }
  };

  const loadDashboard = async ({ force = false } = {}) => {
    if (!user?.email) return;

    if (!force) {
      const hasCache = loadDashboardCache();

      if (hasCache) {
        startQueueOnly();
        checkPrefetchStatusLight();
        return;
      }
    }

    try {
      setLoading(true);

      const [profileResponse, savedResponse, subscriptionResponse] =
        await Promise.allSettled([
          getCandidateProfile(),
          getSavedJobs(),
          getCurrentSubscription(),
        ]);

      let finalProfile = {
        ...emptyProfile,
        fullName: user?.name || "",
        email: user?.email || "",
      };

      let finalSavedJobs = [];
      let finalSubscription = null;

      if (profileResponse.status === "fulfilled") {
        const savedProfile = profileResponse.value?.profile || {};

        finalProfile = {
          ...emptyProfile,
          ...savedProfile,
          email: user.email,
          fullName: savedProfile.fullName || user.name || "",
        };
      }

      if (savedResponse.status === "fulfilled") {
        finalSavedJobs = savedResponse.value?.jobs || [];
      }

      if (subscriptionResponse.status === "fulfilled") {
        finalSubscription = subscriptionResponse.value || null;
      }

      setProfile(finalProfile);
      setSavedJobs(finalSavedJobs);
      setSubscription(finalSubscription);

      saveDashboardCache({
        profile: finalProfile,
        savedJobs: finalSavedJobs,
        subscription: finalSubscription,
        recommendedJobsCount,
        prefetchStatus,
      });

      startQueueOnly();
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    sessionStorage.removeItem(dashboardCacheKey);
    sessionStorage.removeItem(recommendedCacheKey);
    await loadDashboard({ force: true });
  };

  useEffect(() => {
    loadDashboard();
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return;

    const interval = setInterval(() => {
      if (prefetchStatus === "queued" || prefetchStatus === "processing") {
        checkPrefetchStatusLight();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user?.email, prefetchStatus]);

  const quickActions = [
    {
      title: "Complete Profile",
      path: "/candidate/complete-profile",
      icon: UserCircle,
      text:
        profileCompletion >= 70
          ? "Review and update your profile."
          : "Complete missing profile fields.",
    },
    {
      title: "Upload Resume",
      path: "/candidate/resume-upload",
      icon: Upload,
      text: "Upload resume for better AI matching.",
    },
    {
      title: "Analyze Profile",
      path: "/candidate/profile-analysis",
      icon: Brain,
      text: "Check score, strengths and improvements.",
    },
    {
      title: "Find Jobs",
      path: "/candidate/recommended-jobs",
      icon: Briefcase,
      text:
        prefetchStatus === "completed"
          ? "Recommended jobs are ready."
          : "AI matching is preparing in background.",
    },
  ];

  const aiSuggestions = [];

  if (profileCompletion < 70) {
    aiSuggestions.push("Complete your profile to improve recruiter visibility.");
  }

  if (!profile.skills) {
    aiSuggestions.push("Add technical skills for better job matching.");
  }

  if (!profile.summary) {
    aiSuggestions.push("Add a professional summary to improve your profile score.");
  }

  if (!profile.linkedin) {
    aiSuggestions.push("Add LinkedIn profile to increase credibility.");
  }

  if (!profile.github && !profile.portfolio) {
    aiSuggestions.push("Add GitHub or portfolio link for technical roles.");
  }

  if (savedJobs.length === 0) {
    aiSuggestions.push("Save jobs from recommendations to track opportunities.");
  }

  if (currentPlan === "free") {
    aiSuggestions.push("Upgrade to Pro for unlimited saved jobs and advanced AI matching.");
  }

  const finalSuggestions =
    aiSuggestions.length > 0
      ? aiSuggestions.slice(0, 5)
      : ["Your profile looks strong. AI recommendations are ready to explore."];

  const recentActivity = [
    profileCompletion > 0 && {
      icon: UserCircle,
      text: `Profile completion is ${profileCompletion}%`,
    },
    recommendedJobsCount > 0 && {
      icon: Briefcase,
      text: `${recommendedJobsCount} recommended job${
        recommendedJobsCount === 1 ? "" : "s"
      } ready`,
    },
    (prefetchStatus === "queued" || prefetchStatus === "processing") && {
      icon: Sparkles,
      text: "AI recommendation worker is preparing jobs",
    },
    savedJobs.length > 0 && {
      icon: BookmarkCheck,
      text: `${savedJobs.length} saved job${
        savedJobs.length === 1 ? "" : "s"
      } in your account`,
    },
    currentPlan && {
      icon: Crown,
      text: `${currentPlan.toUpperCase()} plan active`,
    },
    skillCount > 0 && {
      icon: Code2,
      text: `${skillCount} skill${skillCount === 1 ? "" : "s"} added`,
    },
  ].filter(Boolean);

  return (
    <DashboardLayout role="candidate">
      <section className="mb-10">
        <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div>
              <p className="text-cyan-400 font-semibold uppercase tracking-wider">
                Welcome Back, {displayName}
              </p>

              <h1 className="text-3xl md:text-5xl font-extrabold mt-3 leading-tight">
                Your Career Growth
                <br />
                <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>

              <p className="text-slate-300 mt-4 max-w-2xl">
                Dashboard opens fast. AI recommendations run through background
                worker without blocking other pages.
              </p>
            </div>

            <button
              onClick={handleRefresh}
              className="px-5 py-3 rounded-2xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition flex items-center justify-center gap-2"
            >
              <RefreshCcw size={18} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-8 mb-10">
          <Loader text="Loading dashboard..." />
        </div>
      ) : (
        <>
          <ProfileStrength
            profileCompletion={profileCompletion}
            resumeScore={resumeScore}
            recommendedJobsCount={
              recommendedJobsCount > 0
                ? recommendedJobsCount
                : prefetchStatus === "completed"
                ? 0
                : "Preparing"
            }
            skillGrowth={skillGrowth}
          />

          <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
            <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6">
              <BookmarkCheck className="text-cyan-400 mb-4" size={34} />
              <p className="text-slate-400">Saved Jobs</p>
              <h2 className="text-4xl font-extrabold mt-2">
                {savedJobs.length}
              </h2>
              <p className="text-slate-300 mt-2">
                {isSavedUnlimited
                  ? "Unlimited saves enabled"
                  : `${savedJobs.length}/${savedLimit} used`}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6">
              <Crown className="text-yellow-400 mb-4" size={34} />
              <p className="text-slate-400">Current Plan</p>
              <h2 className="text-4xl font-extrabold mt-2 capitalize">
                {currentPlan}
              </h2>
              <p className="text-slate-300 mt-2">
                {currentPlan === "free"
                  ? "Basic AI access"
                  : currentPlan === "pro"
                  ? "Advanced AI enabled"
                  : "Premium tools enabled"}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6">
              <Brain className="text-purple-400 mb-4" size={34} />
              <p className="text-slate-400">AI Job Matching</p>
              <h2 className="text-4xl font-extrabold mt-2 capitalize">
                {prefetchStatus === "completed"
                  ? "Ready"
                  : prefetchStatus === "queued" ||
                    prefetchStatus === "processing"
                  ? "Running"
                  : "Queued"}
              </h2>
              <p className="text-slate-300 mt-2">
                Runs in worker, not in page load
              </p>
            </div>

            <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6">
              <Code2 className="text-cyan-400 mb-4" size={34} />
              <p className="text-slate-400">Skills Added</p>
              <h2 className="text-4xl font-extrabold mt-2">{skillCount}</h2>
              <p className="text-slate-300 mt-2">Used for job matching</p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-extrabold mb-5">Quick Actions</h2>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.title}
                    to={action.path}
                    className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 hover:border-cyan-400/40 transition group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                      <Icon size={28} />
                    </div>

                    <h3 className="text-xl font-bold">{action.title}</h3>

                    <p className="text-slate-400 mt-2">{action.text}</p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-3xl bg-slate-900/70 border border-slate-800 p-6">
              <h2 className="text-2xl font-extrabold mb-4 flex items-center gap-2">
                <Brain className="text-cyan-400" size={24} />
                AI Suggestions
              </h2>

              <ul className="space-y-4 text-slate-300">
                {finalSuggestions.map((suggestion, index) => (
                  <li
                    key={`${suggestion}-${index}`}
                    className="border-b border-slate-800 last:border-b-0 pb-3 flex items-start gap-3"
                  >
                    {suggestion.toLowerCase().includes("upgrade") ? (
                      <Crown
                        className="text-yellow-400 shrink-0 mt-0.5"
                        size={19}
                      />
                    ) : (
                      <Sparkles
                        className="text-cyan-400 shrink-0 mt-0.5"
                        size={19}
                      />
                    )}

                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6">
              <h2 className="text-2xl font-extrabold mb-4 flex items-center gap-2">
                <Star className="text-cyan-400" size={24} />
                Recent Activity
              </h2>

              {recentActivity.length > 0 ? (
                <ul className="space-y-4 text-slate-300">
                  {recentActivity.map((activity, index) => {
                    const Icon = activity.icon;

                    return (
                      <li
                        key={`${activity.text}-${index}`}
                        className="border-b border-slate-800 last:border-b-0 pb-3 flex items-center gap-2"
                      >
                        <Icon size={18} className="text-cyan-400 shrink-0" />
                        <span>{activity.text}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-slate-400">
                  No activity found yet. Complete your profile to start tracking.
                </p>
              )}
            </div>
          </section>

          {currentPlan === "free" && (
            <section className="mt-8">
              <div className="rounded-[2rem] border border-yellow-400/20 bg-yellow-500/10 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold flex items-center gap-2">
                    <Crown className="text-yellow-400" size={26} />
                    Unlock Pro Career Tools
                  </h2>

                  <p className="text-slate-300 mt-2">
                    Free plan has limited saved jobs and recommendations.
                    Upgrade for unlimited saved jobs, advanced matching, and
                    deeper AI insights.
                  </p>
                </div>

                <Link
                  to="/candidate/subscription"
                  className="px-6 py-3 rounded-2xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition text-center"
                >
                  View Plans
                </Link>
              </div>
            </section>
          )}
        </>
      )}
    </DashboardLayout>
  );
}