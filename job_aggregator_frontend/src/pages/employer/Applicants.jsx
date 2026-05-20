import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../../layouts/DashboardLayout";

import ApplicantCard from "../../components/employer/ApplicantCard";

import {
    Users,
    FileText,
    CheckCircle,
    Clock,
    Cpu,
    Sparkles,
    Search,
    RefreshCw,
    Trophy,
    AlertCircle,
} from "lucide-react";

import { useEmployerData } from "../../context/EmployerDataContext";

export default function Applicants() {

    const {
        applicants,
        applicantStats,
        loading,
        error,
        refreshApplicants,
    } = useEmployerData();

    const [search, setSearch] =
        useState("");

    const [matchFilter, setMatchFilter] =
        useState("all");

    const refreshing =
        loading.applicants || false;

    const loadApplicants =
        async (silent = false) => {

            await refreshApplicants({
                force: silent,
            });

        };

    useEffect(() => {

        refreshApplicants();

    }, []);

    const stats =
        applicantStats || {
            totalApplicants: 0,
            shortlisted: 0,
            pendingReview: 0,
            strongMatches: 0,
        };

    const filteredApplicants =
        useMemo(() => {

            const q =
                search.trim().toLowerCase();

            return applicants.filter(
                (applicant) => {

                    const score =
                        Number(
                            applicant.matchScore ||
                            applicant.score ||
                            0
                        );

                    const matchesScore =
                        matchFilter ===
                            "all"
                            ? true
                            : matchFilter ===
                                "strong"
                                ? score >= 80
                                : matchFilter ===
                                    "medium"
                                    ? score >= 50 &&
                                    score < 80
                                    : score < 50;

                    const skills =
                        Array.isArray(
                            applicant.skills
                        )
                            ? applicant.skills.join(
                                " "
                            )
                            : applicant.skills ||
                            "";

                    const haystack = [
                        applicant.name,
                        applicant.candidateName,
                        applicant.fullName,
                        applicant.email,
                        applicant.candidateEmail,
                        applicant.role,
                        applicant.detectedRole,
                        applicant.currentRole,
                        applicant.jobTitle,
                        applicant.status,
                        applicant.recommendation,
                        applicant.aiStatus,
                        skills,
                    ]
                        .join(" ")
                        .toLowerCase();

                    return (
                        matchesScore &&
                        (q
                            ? haystack.includes(
                                q
                            )
                            : true)
                    );

                }
            );

        }, [
            applicants,
            search,
            matchFilter,
        ]);

    const statCards = [
        {
            title: "Total Applicants",
            value:
                stats.totalApplicants,
            icon: FileText,
            color: "text-orange-300",
        },
        {
            title: "Strong Matches",
            value:
                stats.strongMatches,
            icon: Trophy,
            color: "text-cyan-300",
        },
        {
            title: "Shortlisted",
            value:
                stats.shortlisted,
            icon: CheckCircle,
            color: "text-emerald-300",
        },
        {
            title: "Pending Review",
            value:
                stats.pendingReview,
            icon: Clock,
            color: "text-slate-300",
        },
    ];

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

                                        AI Applicant Intelligence

                                    </p>

                                    <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">

                                        Applicants

                                    </h1>

                                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">

                                        Track real applicants,
                                        AI match scores,
                                        skill gaps,
                                        strengths,
                                        weaknesses,
                                        and interview questions.

                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    loadApplicants(
                                        true
                                    )
                                }
                                disabled={
                                    refreshing
                                }
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
                                    : "Refresh Applicants"}

                            </button>

                        </div>

                    </div>

                </div>

                {error.applicants && (

                    <div className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">

                        <AlertCircle
                            className="mt-0.5 shrink-0"
                            size={20}
                        />

                        <span>

                            {error.applicants}

                        </span>

                    </div>

                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    {statCards.map(
                        (item) => {

                            const Icon =
                                item.icon;

                            return (

                                <div
                                    key={
                                        item.title
                                    }
                                    className="rounded-[1.5rem] border border-slate-800 bg-slate-900/75 p-5 shadow-xl"
                                >

                                    <Icon
                                        className={`mb-3 ${item.color}`}
                                        size={28}
                                    />

                                    <p className="text-sm text-slate-400">

                                        {
                                            item.title
                                        }

                                    </p>

                                    <h2 className="mt-1 text-3xl font-black text-white">

                                        {item.value ||
                                            0}

                                    </h2>

                                </div>

                            );

                        }
                    )}

                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-4 shadow-xl sm:p-5">

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                        <div className="flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 lg:min-w-[380px]">

                            <Search
                                className="shrink-0 text-orange-300"
                                size={18}
                            />

                            <input
                                value={search}
                                onChange={(
                                    e
                                ) =>
                                    setSearch(
                                        e
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Search applicant, job, skill, email..."
                                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                            />

                        </div>

                        <div className="flex flex-wrap gap-2">

                            {[
                                [
                                    "all",
                                    "All",
                                ],
                                [
                                    "strong",
                                    "Strong 80%+",
                                ],
                                [
                                    "medium",
                                    "Medium 50-79%",
                                ],
                                [
                                    "low",
                                    "Low <50%",
                                ],
                            ].map(
                                ([
                                    value,
                                    label,
                                ]) => (

                                    <button
                                        key={
                                            value
                                        }
                                        type="button"
                                        onClick={() =>
                                            setMatchFilter(
                                                value
                                            )
                                        }
                                        className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${matchFilter ===
                                                value
                                                ? "border-orange-400/40 bg-orange-500/10 text-orange-200"
                                                : "border-slate-700 bg-slate-950/80 text-slate-300 hover:border-orange-400/50 hover:text-orange-200"
                                            }`}
                                    >

                                        {
                                            label
                                        }

                                    </button>

                                )
                            )}

                        </div>

                    </div>

                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-4 shadow-xl sm:p-6">

                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            <h2 className="text-2xl font-black text-white">

                                AI Ranked Applicants

                            </h2>

                            <p className="text-sm text-slate-400">

                                Showing{" "}
                                {
                                    filteredApplicants.length
                                }{" "}
                                candidate(s)

                            </p>

                        </div>

                        <Users
                            className="text-orange-300"
                            size={28}
                        />

                    </div>

                    {loading.applicants ? (

                        <div className="flex min-h-[260px] items-center justify-center text-slate-400">

                            Loading applicants and calculating AI match scores...

                        </div>

                    ) : filteredApplicants.length ===
                        0 ? (

                        <div className="py-14 text-center">

                            <Users
                                className="mx-auto mb-4 text-orange-300"
                                size={44}
                            />

                            <h2 className="text-2xl font-black text-white">

                                No applicants found

                            </h2>

                            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">

                                Applicants will appear here after candidates apply to your posted jobs.

                            </p>

                        </div>

                    ) : (

                        <div className="space-y-4">

                            {filteredApplicants.map(
                                (
                                    applicant
                                ) => (

                                    <ApplicantCard
                                        key={
                                            applicant._id ||
                                            `${applicant.email}-${applicant.jobId}`
                                        }
                                        applicant={
                                            applicant
                                        }
                                        onStatusUpdated={() =>
                                            loadApplicants(
                                                true
                                            )
                                        }
                                    />

                                )
                            )}

                        </div>

                    )}

                </div>

            </div>

        </DashboardLayout>

    );
}