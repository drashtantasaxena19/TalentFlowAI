import { useEffect } from "react";
import {
    Briefcase,
    Users,
    Building2,
    Trophy,
    AlertCircle,
    Cpu,
    Sparkles,
    Activity,
    ArrowUpRight,
    MapPin,
    RefreshCw,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import { useEmployerData } from "../../context/EmployerDataContext";

export default function EmployerDashboard() {

    const {
        dashboard: data,
        loading,
        error,
        refreshDashboard,
    } = useEmployerData();

    const refreshing = loading.dashboard || false;

    const loadDashboard = async (silent = false) => {
        await refreshDashboard({
            force: silent,
        });
    };

    useEffect(() => {
        refreshDashboard();
    }, []);

    const stats = [
        {
            title: "Total Posted Jobs",
            value: data?.stats?.totalJobs ?? 0,
            icon: Briefcase,
            hint: "Jobs created by your company",
        },
        {
            title: "Active Jobs",
            value: data?.stats?.activeJobs ?? 0,
            icon: Activity,
            hint: "Currently visible/open roles",
        },
        {
            title: "Total Applicants",
            value: data?.stats?.totalApplicants ?? 0,
            icon: Users,
            hint: "Candidates in your pipeline",
        },
        {
            title: "Shortlisted",
            value: data?.stats?.shortlisted ?? 0,
            icon: Trophy,
            hint: "Candidates moved ahead",
        },
    ];

    const completion =
        data?.stats?.profileCompletion ?? 0;

    return (
        <DashboardLayout role="employer">
            <div className="space-y-6">

                <div className="overflow-hidden rounded-[2rem] border border-orange-400/20 bg-slate-950/80 shadow-2xl">

                    <div className="relative p-5 sm:p-6 lg:p-8">

                        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />

                        <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

                        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                            <div className="flex items-start gap-4">

                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-400/30 bg-orange-500/10">

                                    <Cpu
                                        className="text-orange-300"
                                        size={28}
                                    />

                                </div>

                                <div>

                                    <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-orange-300">

                                        <Sparkles size={16} />

                                        Recruiter Intelligence Console

                                    </p>

                                    <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">

                                        Recruiter Dashboard

                                    </h1>

                                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">

                                        Manage job posts, track applicants,
                                        monitor profile strength, and improve
                                        hiring visibility.

                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    loadDashboard(true)
                                }
                                disabled={refreshing}
                                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-orange-400/60 hover:text-orange-200 disabled:opacity-60"
                            >

                                <RefreshCw
                                    size={18}
                                    className={
                                        refreshing
                                            ? "animate-spin"
                                            : ""
                                    }
                                />

                                {refreshing
                                    ? "Refreshing..."
                                    : "Refresh Data"}

                            </button>

                        </div>

                    </div>

                </div>

                {error.dashboard && (

                    <div className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">

                        <AlertCircle
                            className="mt-0.5 shrink-0"
                            size={20}
                        />

                        <span>
                            {error.dashboard}
                        </span>

                    </div>

                )}

                {loading.dashboard ? (

                    <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-8 text-center text-slate-400 shadow-xl">

                        Loading recruiter dashboard...

                    </div>

                ) : (

                    <>

                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

                            {stats.map((item) => {

                                const Icon = item.icon;

                                return (

                                    <div
                                        key={item.title}
                                        className="group rounded-[2rem] border border-slate-800 bg-slate-900/75 p-5 shadow-xl transition hover:-translate-y-1 hover:border-orange-400/30 hover:shadow-orange-500/10"
                                    >

                                        <div className="mb-4 flex items-start justify-between gap-3">

                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10">

                                                <Icon
                                                    className="text-orange-300 transition group-hover:scale-110"
                                                    size={24}
                                                />

                                            </div>

                                            <ArrowUpRight
                                                className="text-slate-600 transition group-hover:text-cyan-300"
                                                size={20}
                                            />

                                        </div>

                                        <p className="text-sm font-semibold text-slate-400">

                                            {item.title}

                                        </p>

                                        <h2 className="mt-1 text-3xl font-black text-white">

                                            {item.value}

                                        </h2>

                                        <p className="mt-2 text-xs text-slate-500">

                                            {item.hint}

                                        </p>

                                    </div>

                                );

                            })}

                        </div>

                        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">

                            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-5 shadow-xl sm:p-6">

                                <div className="mb-5 flex items-center gap-3">

                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10">

                                        <Building2
                                            className="text-orange-300"
                                            size={25}
                                        />

                                    </div>

                                    <div>

                                        <h2 className="text-xl font-bold">

                                            Company Profile

                                        </h2>

                                        <p className="text-sm text-slate-400">

                                            Completion:
                                            {" "}
                                            {completion}%

                                        </p>

                                    </div>

                                </div>

                                <div className="h-3 overflow-hidden rounded-full bg-slate-800">

                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-orange-400 via-cyan-300 to-blue-400 transition-all duration-500"
                                        style={{
                                            width: `${completion}%`,
                                        }}
                                    />

                                </div>

                                <p className="mt-4 text-sm leading-relaxed text-slate-400">

                                    A complete company profile improves trust
                                    and gives candidates better hiring context.

                                </p>

                            </div>

                            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-5 shadow-xl sm:p-6">

                                <div className="mb-5 flex items-center justify-between gap-3">

                                    <div>

                                        <h2 className="text-xl font-bold">

                                            Recent Jobs

                                        </h2>

                                        <p className="text-sm text-slate-400">

                                            Latest roles posted by your company

                                        </p>

                                    </div>

                                    <Briefcase
                                        className="text-cyan-300"
                                        size={24}
                                    />

                                </div>

                                {data?.recentJobs?.length > 0 ? (

                                    <div className="space-y-3">

                                        {data.recentJobs.map((job) => (

                                            <div
                                                key={job._id}
                                                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-orange-400/30"
                                            >

                                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                                                    <div>

                                                        <h3 className="text-base font-bold text-white sm:text-lg">

                                                            {job.title}

                                                        </h3>

                                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">

                                                            <span>

                                                                {job.company ||
                                                                    "Company not added"}

                                                            </span>

                                                            <span className="hidden sm:inline">

                                                                •

                                                            </span>

                                                            <span className="flex items-center gap-1">

                                                                <MapPin size={14} />

                                                                {job.location ||
                                                                    "Location not added"}

                                                            </span>

                                                        </div>

                                                    </div>

                                                    <span
                                                        className={`w-fit rounded-full border px-3 py-1 text-xs font-bold capitalize ${job.status === "active"
                                                            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                                                            : "border-slate-700 bg-slate-800 text-slate-300"
                                                            }`}
                                                    >

                                                        {job.status || "active"}

                                                    </span>

                                                </div>

                                            </div>

                                        ))}

                                    </div>

                                ) : (

                                    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">

                                        <Briefcase
                                            className="mx-auto mb-3 text-orange-300"
                                            size={34}
                                        />

                                        <h3 className="text-lg font-bold">

                                            No jobs posted yet

                                        </h3>

                                        <p className="mt-2 text-sm text-slate-400">

                                            Post your first job to start building
                                            a candidate pipeline.

                                        </p>

                                    </div>

                                )}

                            </div>

                        </div>

                    </>

                )}

            </div>
        </DashboardLayout>
    );
}