import { useEffect, useMemo, useState } from "react";

import {
    Briefcase,
    MapPin,
    IndianRupee,
    Trash2,
    RefreshCw,
    ToggleLeft,
    ToggleRight,
    Search,
    Cpu,
    Sparkles,
    AlertCircle,
    CheckCircle2,
    Activity,
    Clock,
    Laptop,
    Edit3,
    X,
    Save,
    Eye,
    Download,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";

import JobViewModal from "../../components/employer/JobViewModal";

import { downloadJobPdf } from "../../utils/jobPdfGenerator";

import {
    deleteEmployerJob,
    updateEmployerJob,
} from "../../services/employerApi";

import { useEmployerData } from "../../context/EmployerDataContext";

const inputClass =
    "w-full rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-orange-400/80";

const textAreaClass =
    "w-full resize-none rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-orange-400/80";

export default function ManageJobs() {

    const {
        jobs,
        setJobs,
        loading,
        refreshJobs,
    } = useEmployerData();

    const [actionLoading, setActionLoading] =
        useState("");

    const [toast, setToast] =
        useState(null);

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("all");

    const [editingJob, setEditingJob] =
        useState(null);

    const [viewingJob, setViewingJob] =
        useState(null);

    const refreshing =
        loading.jobs || false;

    const loadJobs = async (
        silent = false
    ) => {

        try {

            await refreshJobs({
                force: silent,
            });

        } catch (err) {

            setToast({
                type: "error",
                text:
                    err?.response?.data?.detail ||
                    "Failed to load jobs",
            });

        }

    };

    useEffect(() => {

        refreshJobs();

    }, []);

    useEffect(() => {

        if (!toast) return;

        const timer = setTimeout(
            () => setToast(null),
            3500
        );

        return () => clearTimeout(timer);

    }, [toast]);

    const filteredJobs = useMemo(() => {

        const q =
            search.trim().toLowerCase();

        return jobs.filter((job) => {

            const status =
                job.status || "active";

            const matchesStatus =
                statusFilter === "all" ||
                status === statusFilter;

            const haystack = [
                job.title,
                job.company,
                job.location,
                job.salary,
                job.jobType,
                job.workMode,

                Array.isArray(job.skills)
                    ? job.skills.join(" ")
                    : job.skills,
            ]
                .join(" ")
                .toLowerCase();

            return (
                matchesStatus &&
                (q
                    ? haystack.includes(q)
                    : true)
            );

        });

    }, [
        jobs,
        search,
        statusFilter,
    ]);

    const stats = useMemo(() => {

        const total = jobs.length;

        const active =
            jobs.filter(
                (job) =>
                    (job.status ||
                        "active") ===
                    "active"
            ).length;

        const closed =
            jobs.filter(
                (job) =>
                    job.status ===
                    "closed"
            ).length;

        return {
            total,
            active,
            closed,
        };

    }, [jobs]);

    const openEditModal = (
        job
    ) => {

        setEditingJob({
            ...job,

            skills: Array.isArray(
                job.skills
            )
                ? job.skills.join(", ")
                : job.skills || "",
        });

    };

    const handleEditChange = (
        e
    ) => {

        const {
            name,
            value,
        } = e.target;

        setEditingJob((prev) => ({
            ...prev,
            [name]: value,
        }));

    };

    const handleUpdateJob =
        async (e) => {

            e.preventDefault();

            try {

                setActionLoading(
                    editingJob._id
                );

                const payload = {
                    ...editingJob,

                    skills: String(
                        editingJob.skills || ""
                    )
                        .split(",")
                        .map((skill) =>
                            skill.trim()
                        )
                        .filter(Boolean),
                };

                const res =
                    await updateEmployerJob(
                        editingJob._id,
                        payload
                    );

                setJobs((prev) =>
                    prev.map((item) =>
                        item._id ===
                        editingJob._id
                            ? res.job
                            : item
                    )
                );

                setToast({
                    type: "success",
                    text:
                        "Job updated successfully.",
                });

                setEditingJob(null);

            } catch (err) {

                setToast({
                    type: "error",
                    text:
                        err?.response?.data?.detail ||
                        "Failed to update job",
                });

            } finally {

                setActionLoading("");

            }

        };

    const handleDelete =
        async (jobId) => {

            const confirmDelete =
                window.confirm(
                    "Are you sure you want to delete this job?"
                );

            if (!confirmDelete)
                return;

            try {

                setActionLoading(jobId);

                await deleteEmployerJob(
                    jobId
                );

                setJobs((prev) =>
                    prev.filter(
                        (job) =>
                            job._id !==
                            jobId
                    )
                );

                setToast({
                    type: "success",
                    text:
                        "Job deleted successfully.",
                });

            } catch (err) {

                setToast({
                    type: "error",
                    text:
                        err?.response?.data?.detail ||
                        "Failed to delete job",
                });

            } finally {

                setActionLoading("");

            }

        };

    const handleStatusToggle =
        async (job) => {

            const currentStatus =
                job.status || "active";

            const nextStatus =
                currentStatus ===
                "active"
                    ? "closed"
                    : "active";

            try {

                setActionLoading(
                    job._id
                );

                const res =
                    await updateEmployerJob(
                        job._id,
                        {
                            status:
                                nextStatus,
                        }
                    );

                setJobs((prev) =>
                    prev.map((item) =>
                        item._id ===
                        job._id
                            ? res.job
                            : item
                    )
                );

                setToast({
                    type: "success",
                    text: `Job marked as ${nextStatus}.`,
                });

            } catch (err) {

                setToast({
                    type: "error",
                    text:
                        err?.response?.data?.detail ||
                        "Failed to update job status",
                });

            } finally {

                setActionLoading("");

            }

        };

    return (

        <DashboardLayout role="employer">

            <div className="space-y-6">

                {toast && (

                    <div className="fixed right-4 top-5 z-[9999] w-[calc(100%-2rem)] max-w-md">

                        <div
                            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
                                toast.type ===
                                "success"
                                    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                                    : "border-red-400/30 bg-red-500/15 text-red-200"
                            }`}
                        >

                            {toast.type ===
                            "success" ? (

                                <CheckCircle2
                                    className="mt-0.5 shrink-0"
                                    size={21}
                                />

                            ) : (

                                <AlertCircle
                                    className="mt-0.5 shrink-0"
                                    size={21}
                                />

                            )}

                            <div>

                                <p className="font-bold">

                                    {toast.type ===
                                    "success"
                                        ? "Success"
                                        : "Error"}

                                </p>

                                <p className="text-sm opacity-90">

                                    {toast.text}

                                </p>

                            </div>

                        </div>

                    </div>

                )}

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

                                        Employer Job Control

                                    </p>

                                    <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">

                                        Manage Jobs

                                    </h1>

                                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">

                                        Manage all active and closed jobs,
                                        update job details,
                                        export job PDFs,
                                        and control hiring visibility.

                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    loadJobs(true)
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
                                    : "Refresh Jobs"}

                            </button>

                        </div>

                    </div>

                </div>

                <div className="grid gap-4 sm:grid-cols-3">

                    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/75 p-5 shadow-xl">

                        <Briefcase
                            className="mb-3 text-orange-300"
                            size={28}
                        />

                        <p className="text-sm text-slate-400">

                            Total Jobs

                        </p>

                        <h2 className="mt-1 text-3xl font-black text-white">

                            {stats.total}

                        </h2>

                    </div>

                    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/75 p-5 shadow-xl">

                        <Activity
                            className="mb-3 text-emerald-300"
                            size={28}
                        />

                        <p className="text-sm text-slate-400">

                            Active Jobs

                        </p>

                        <h2 className="mt-1 text-3xl font-black text-white">

                            {stats.active}

                        </h2>

                    </div>

                    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/75 p-5 shadow-xl">

                        <Clock
                            className="mb-3 text-red-300"
                            size={28}
                        />

                        <p className="text-sm text-slate-400">

                            Closed Jobs

                        </p>

                        <h2 className="mt-1 text-3xl font-black text-white">

                            {stats.closed}

                        </h2>

                    </div>

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
                                onChange={(e) =>
                                    setSearch(
                                        e.target
                                            .value
                                    )
                                }
                                placeholder="Search jobs..."
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
                                    "active",
                                    "Active",
                                ],
                                [
                                    "closed",
                                    "Closed",
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
                                            setStatusFilter(
                                                value
                                            )
                                        }
                                        className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${
                                            statusFilter ===
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

                <div className="space-y-4">

                    {filteredJobs.length ===
                    0 ? (

                        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 py-16 text-center">

                            <Briefcase
                                className="mx-auto mb-4 text-orange-300"
                                size={42}
                            />

                            <h2 className="text-2xl font-black text-white">

                                No jobs found

                            </h2>

                        </div>

                    ) : (

                        filteredJobs.map(
                            (job) => {

                                const status =
                                    job.status ||
                                    "active";

                                return (

                                    <div
                                        key={
                                            job._id
                                        }
                                        className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-5 shadow-xl"
                                    >

                                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                                            <div className="space-y-3">

                                                <div className="flex flex-wrap items-center gap-3">

                                                    <h2 className="text-2xl font-black text-white">

                                                        {
                                                            job.title
                                                        }

                                                    </h2>

                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                                                            status ===
                                                            "active"
                                                                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20"
                                                                : "bg-red-500/10 text-red-300 border border-red-400/20"
                                                        }`}
                                                    >

                                                        {
                                                            status
                                                        }

                                                    </span>

                                                </div>

                                                <div className="flex flex-wrap gap-4 text-sm text-slate-400">

                                                    <div className="flex items-center gap-2">

                                                        <MapPin
                                                            size={
                                                                16
                                                            }
                                                        />

                                                        {
                                                            job.location
                                                        }

                                                    </div>

                                                    <div className="flex items-center gap-2">

                                                        <IndianRupee
                                                            size={
                                                                16
                                                            }
                                                        />

                                                        {
                                                            job.salary
                                                        }

                                                    </div>

                                                    <div className="flex items-center gap-2">

                                                        <Laptop
                                                            size={
                                                                16
                                                            }
                                                        />

                                                        {
                                                            job.workMode ||
                                                            "Remote"
                                                        }

                                                    </div>

                                                </div>

                                                <p className="max-w-3xl text-sm text-slate-400">

                                                    {
                                                        job.description
                                                    }

                                                </p>

                                            </div>

                                            <div className="flex flex-wrap gap-3">

                                                <button
                                                    onClick={() =>
                                                        setViewingJob(
                                                            job
                                                        )
                                                    }
                                                    className="flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-300"
                                                >

                                                    <Eye
                                                        size={
                                                            18
                                                        }
                                                    />

                                                    View

                                                </button>

                                                <button
                                                    onClick={() =>
                                                        openEditModal(
                                                            job
                                                        )
                                                    }
                                                    className="flex items-center gap-2 rounded-2xl border border-orange-400/20 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300"
                                                >

                                                    <Edit3
                                                        size={
                                                            18
                                                        }
                                                    />

                                                    Edit

                                                </button>

                                                <button
                                                    onClick={() =>
                                                        downloadJobPdf(
                                                            job
                                                        )
                                                    }
                                                    className="flex items-center gap-2 rounded-2xl border border-purple-400/20 bg-purple-500/10 px-4 py-3 text-sm font-bold text-purple-300"
                                                >

                                                    <Download
                                                        size={
                                                            18
                                                        }
                                                    />

                                                    PDF

                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleStatusToggle(
                                                            job
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading ===
                                                        job._id
                                                    }
                                                    className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300"
                                                >

                                                    {status ===
                                                    "active" ? (
                                                        <ToggleRight
                                                            size={
                                                                20
                                                            }
                                                        />
                                                    ) : (
                                                        <ToggleLeft
                                                            size={
                                                                20
                                                            }
                                                        />
                                                    )}

                                                    Toggle

                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleDelete(
                                                            job._id
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading ===
                                                        job._id
                                                    }
                                                    className="flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300"
                                                >

                                                    <Trash2
                                                        size={
                                                            18
                                                        }
                                                    />

                                                    Delete

                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                );

                            }
                        )

                    )}

                </div>

                {editingJob && (

                    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

                        <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-slate-800 bg-slate-950 p-6 shadow-2xl">

                            <div className="mb-6 flex items-center justify-between">

                                <h2 className="text-2xl font-black text-white">

                                    Edit Job

                                </h2>

                                <button
                                    onClick={() =>
                                        setEditingJob(
                                            null
                                        )
                                    }
                                    className="rounded-xl border border-slate-700 p-2 text-slate-400 hover:text-white"
                                >

                                    <X
                                        size={
                                            20
                                        }
                                    />

                                </button>

                            </div>

                            <form
                                onSubmit={
                                    handleUpdateJob
                                }
                                className="grid gap-5 md:grid-cols-2"
                            >

                                <input
                                    name="title"
                                    value={
                                        editingJob.title
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                    placeholder="Job title"
                                    className={
                                        inputClass
                                    }
                                />

                                <input
                                    name="company"
                                    value={
                                        editingJob.company
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                    placeholder="Company"
                                    className={
                                        inputClass
                                    }
                                />

                                <input
                                    name="location"
                                    value={
                                        editingJob.location
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                    placeholder="Location"
                                    className={
                                        inputClass
                                    }
                                />

                                <input
                                    name="salary"
                                    value={
                                        editingJob.salary
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                    placeholder="Salary"
                                    className={
                                        inputClass
                                    }
                                />

                                <input
                                    name="jobType"
                                    value={
                                        editingJob.jobType
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                    placeholder="Job Type"
                                    className={
                                        inputClass
                                    }
                                />

                                <input
                                    name="workMode"
                                    value={
                                        editingJob.workMode
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                    placeholder="Work Mode"
                                    className={
                                        inputClass
                                    }
                                />

                                <div className="md:col-span-2">

                                    <input
                                        name="skills"
                                        value={
                                            editingJob.skills
                                        }
                                        onChange={
                                            handleEditChange
                                        }
                                        placeholder="Skills comma separated"
                                        className={
                                            inputClass
                                        }
                                    />

                                </div>

                                <div className="md:col-span-2">

                                    <textarea
                                        rows={6}
                                        name="description"
                                        value={
                                            editingJob.description
                                        }
                                        onChange={
                                            handleEditChange
                                        }
                                        placeholder="Job description"
                                        className={
                                            textAreaClass
                                        }
                                    />

                                </div>

                                <button
                                    type="submit"
                                    disabled={
                                        actionLoading ===
                                        editingJob._id
                                    }
                                    className="md:col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 via-cyan-400 to-blue-500 px-6 py-4 font-black text-slate-950"
                                >

                                    <Save
                                        size={
                                            20
                                        }
                                    />

                                    Save Changes

                                </button>

                            </form>

                        </div>

                    </div>

                )}

                {viewingJob && (

                    <JobViewModal
                        job={viewingJob}
                        onClose={() =>
                            setViewingJob(
                                null
                            )
                        }
                    />

                )}

            </div>

        </DashboardLayout>

    );
}