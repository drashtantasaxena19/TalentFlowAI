import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import JobCard from "../../components/candidate/JobCard";
import { getMyApplications } from "../../services/jobsApi";

export default function AppliedJobs() {
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        loadAppliedJobs();
    }, []);

    const loadAppliedJobs = async () => {
        try {
            const res = await getMyApplications();
            setJobs(res.applications || []);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <DashboardLayout role="candidate">
            <div className="space-y-6">
                <h1 className="text-3xl font-extrabold">Applied Jobs</h1>

                {jobs.length ? (
                    jobs.map((job) => (
                        <JobCard key={job._id} job={job} />
                    ))
                ) : (
                    <div className="rounded-3xl border border-slate-800 p-10 text-center text-slate-400">
                        No applied jobs yet.
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}