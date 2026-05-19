import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import JobCard from "../../components/candidate/JobCard";
import Loader from "../../components/common/Loader";
import { BookmarkCheck, Crown } from "lucide-react";
import { getSavedJobs, removeSavedJob } from "../../services/jobsApi";
import { getCurrentSubscription } from "../../services/subscriptionApi";
import { useAuth } from "../../context/AuthContext";

export default function SavedJobs() {
  const { user } = useAuth();

  const [savedJobs, setSavedJobs] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSavedJobs = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);

      const [jobsResponse, subscriptionResponse] = await Promise.all([
        getSavedJobs(),
        getCurrentSubscription(),
      ]);

      setSavedJobs(jobsResponse.jobs || []);
      setSubscription(subscriptionResponse || null);
    } catch (error) {
      alert(error.response?.data?.detail || "Could not load saved jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSavedJob = async (job) => {
    try {
      await removeSavedJob(job.applyLink);
      await loadSavedJobs();
    } catch (error) {
      alert(error.response?.data?.detail || "Could not remove saved job");
    }
  };

  useEffect(() => {
    loadSavedJobs();
  }, [user?.email]);

  const currentPlan = subscription?.currentPlan || "free";
  const savedLimit = subscription?.features?.saved_jobs_limit ?? 5;
  const isUnlimited = savedLimit === -1;

  return (
    <DashboardLayout role="candidate">
      <section className="mb-8">
        <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <BookmarkCheck className="text-cyan-400" size={30} />

            <p className="text-cyan-400 font-semibold uppercase tracking-wider">
              Saved Opportunities
            </p>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold mt-3">
            Your Saved
            <span className="block bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Jobs
            </span>
          </h1>

          <p className="text-slate-300 mt-4 max-w-2xl">
            Jobs you save are synced securely with your TalentFlow account.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Crown className="text-yellow-400" size={24} />
            <div>
              <p className="text-slate-300 font-semibold capitalize">
                {currentPlan} Plan
              </p>
              <p className="text-slate-400 text-sm">
                {isUnlimited
                  ? "Unlimited saved jobs enabled."
                  : `${savedJobs.length}/${savedLimit} saved jobs used. Upgrade to Pro for unlimited saved jobs.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-8">
          <Loader text="Loading saved jobs..." />
        </div>
      ) : savedJobs.length === 0 ? (
        <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-8 text-center">
          <h2 className="text-2xl font-bold">No saved jobs yet</h2>
          <p className="text-slate-400 mt-2">
            Save jobs from your recommended jobs page to view them here.
          </p>
        </div>
      ) : (
        <section className="grid gap-6">
          {savedJobs.map((job, index) => (
            <JobCard
              key={job._id || `${job.title}-${job.company}-${index}`}
              job={job}
              isSaved={true}
              onSave={() => handleRemoveSavedJob(job)}
            />
          ))}
        </section>
      )}
    </DashboardLayout>
  );
}