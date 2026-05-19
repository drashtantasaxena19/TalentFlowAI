import { useEffect, useState } from "react";
import { Crown, Briefcase, Sparkles, AlertCircle } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import JobPostForm from "../../components/employer/JobPostForm";
import AIVoiceJobPost from "../../components/employer/AIVoiceJobPost";
import { getCurrentSubscription } from "../../services/subscriptionApi";
import { getEmployerJobs } from "../../services/employerApi";
import { useNavigate } from "react-router-dom";

export default function PostJob() {
    const [generatedFields, setGeneratedFields] = useState({});
    const [subscription, setSubscription] = useState(null);
    const [activeJobs, setActiveJobs] = useState(0);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        loadEmployerPlan();
    }, []);

    const loadEmployerPlan = async () => {
        try {
            setLoading(true);

            const [subRes, jobsRes] = await Promise.all([
                getCurrentSubscription(),
                getEmployerJobs(),
            ]);

            setSubscription(subRes);

            const jobs = jobsRes?.jobs || [];
            const activeCount = jobs.filter(
                (job) => (job.status || "active") === "active"
            ).length;

            setActiveJobs(activeCount);
        } catch (err) {
            setMessage({
                type: "error",
                text:
                    err?.response?.data?.detail ||
                    "Failed to load employer subscription",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateFields = (fields) => {
        setGeneratedFields(fields || {});
    };

    const currentPlanName =
        subscription?.features?.name || "Free Hiring";

    const maxJobs =
        subscription?.features?.active_jobs_limit ?? 2;

    const unlimited = maxJobs === -1;

    const jobsRemaining = unlimited ? "Unlimited" : Math.max(maxJobs - activeJobs, 0);

    const limitReached = !unlimited && activeJobs >= maxJobs;

    const handleUpgrade = () => {
        navigate("/employer/subscription");
    };

    return (
        <DashboardLayout role="employer">
            <div className="space-y-5">
                <div className="rounded-[2rem] bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-purple-500/15 border border-cyan-400/20 p-5 shadow-xl">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="flex items-center gap-2 text-cyan-400 font-semibold uppercase tracking-wider">
                                <Sparkles size={16} />
                                TalentFlow AI Employer
                            </p>

                            <h1 className="mt-2 text-3xl font-extrabold">
                                Post a Job
                            </h1>

                            <p className="text-slate-400 mt-2 max-w-3xl">
                                Add jobs manually or use AI voice posting in Hindi,
                                English, or Hinglish. Your subscription controls
                                active posting limits.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/70 px-4 py-3">
                            <p className="text-sm text-slate-400">
                                Current Plan
                            </p>
                            <h3 className="text-lg font-bold text-cyan-300">
                                {loading ? "Loading..." : currentPlanName}
                            </h3>
                        </div>
                    </div>
                </div>

                {message && (
                    <div
                        className={`rounded-2xl border p-4 flex items-start gap-3 ${
                            message.type === "error"
                                ? "border-red-400/30 bg-red-500/10 text-red-300"
                                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                        }`}
                    >
                        <AlertCircle className="mt-0.5 shrink-0" size={20} />
                        <p>{message.text}</p>
                    </div>
                )}

                <div className="rounded-[2rem] bg-slate-900/75 border border-slate-800 p-4 shadow-xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                                <Briefcase className="text-cyan-400" size={23} />
                            </div>

                            <div>
                                <h2 className="text-lg font-bold">
                                    Current Plan: {loading ? "Loading..." : currentPlanName}
                                </h2>

                                <p className="text-slate-400 mt-1 text-sm">
                                    Active Jobs Used: {loading ? "..." : activeJobs}/
                                    {loading ? "..." : unlimited ? "Unlimited" : maxJobs}
                                </p>

                                <p
                                    className={`text-sm mt-1 ${
                                        limitReached
                                            ? "text-red-300"
                                            : "text-yellow-300"
                                    }`}
                                >
                                    {loading
                                        ? "Checking job limits..."
                                        : limitReached
                                        ? "Job posting limit reached. Upgrade your employer plan."
                                        : unlimited
                                        ? "Unlimited active job posting available."
                                        : `You can post ${jobsRemaining} more active job(s).`}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleUpgrade}
                            className="px-5 py-3 rounded-2xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition flex items-center justify-center gap-2"
                        >
                            <Crown size={18} />
                            Upgrade Plan
                        </button>
                    </div>
                </div>

                {limitReached ? (
                    <div className="rounded-[2rem] border border-red-400/30 bg-red-500/10 p-8 text-center shadow-xl">
                        <Crown className="mx-auto text-red-300 mb-4" size={40} />

                        <h2 className="text-2xl font-extrabold text-white">
                            Posting Limit Reached
                        </h2>

                        <p className="text-slate-300 mt-3 max-w-2xl mx-auto">
                            Your current employer subscription has reached its active
                            job posting limit. Upgrade to Smart Hiring Pro or Enterprise
                            to post more jobs and unlock AI hiring.
                        </p>

                        <button
                            onClick={handleUpgrade}
                            className="mt-5 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-cyan-400 to-blue-500 text-slate-950 font-black"
                        >
                            Upgrade Employer Plan
                        </button>
                    </div>
                ) : (
                    <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-5 items-start">
                        <JobPostForm generatedFields={generatedFields} />
                        <AIVoiceJobPost onGenerateFields={handleGenerateFields} />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}