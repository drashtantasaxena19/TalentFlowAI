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
    getEmployerJobs,
    updateEmployerJob,
} from "../../services/employerApi";

const inputClass =
    "w-full rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-orange-400/80";

const textAreaClass =
    "w-full resize-none rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-orange-400/80";

export default function ManageJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState("");
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [editingJob, setEditingJob] = useState(null);
    const [viewingJob, setViewingJob] = useState(null);

    const loadJobs = async (silent = false) => {
        try {
            silent ? setRefreshing(true) : setLoading(true);
            setToast(null);

            const res = await getEmployerJobs();
            setJobs(res?.jobs || []);
        } catch (err) {
            setToast({
                type: "error",
                text: err?.response?.data?.detail || "Failed to load jobs",
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadJobs();
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(timer);
    }, [toast]);

    const filteredJobs = useMemo(() => {
        const q = search.trim().toLowerCase();

        return jobs.filter((job) => {
            const status = job.status || "active";
            const matchesStatus = statusFilter === "all" || status === statusFilter;

            const haystack = [
                job.title,
                job.company,
                job.location,
                job.salary,
                job.jobType,
                job.workMode,
                Array.isArray(job.skills) ? job.skills.join(" ") : job.skills,
            ]
                .join(" ")
                .toLowerCase();

            return matchesStatus && (q ? haystack.includes(q) : true);
        });
    }, [jobs, search, statusFilter]);

    const stats = useMemo(() => {
        const total = jobs.length;
        const active = jobs.filter((job) => (job.status || "active") === "active").length;
        const closed = jobs.filter((job) => job.status === "closed").length;

        return { total, active, closed };
    }, [jobs]);

    const openEditModal = (job) => {
        setEditingJob({
            ...job,
            skills: Array.isArray(job.skills) ? job.skills.join(", ") : job.skills || "",
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingJob((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdateJob = async (e) => {
        e.preventDefault();

        try {
            setActionLoading(editingJob._id);

            const payload = {
                ...editingJob,
                skills: String(editingJob.skills || "")
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean),
            };

            const res = await updateEmployerJob(editingJob._id, payload);

            setJobs((prev) =>
                prev.map((item) => (item._id === editingJob._id ? res.job : item))
            );

            setToast({
                type: "success",
                text: "Job updated successfully.",
            });

            setEditingJob(null);
        } catch (err) {
            setToast({
                type: "error",
                text: err?.response?.data?.detail || "Failed to update job",
            });
        } finally {
            setActionLoading("");
        }
    };

    const handleDelete = async (jobId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this job?");
        if (!confirmDelete) return;

        try {
            setActionLoading(jobId);
            await deleteEmployerJob(jobId);

            setJobs((prev) => prev.filter((job) => job._id !== jobId));

            setToast({
                type: "success",
                text: "Job deleted successfully.",
            });
        } catch (err) {
            setToast({
                type: "error",
                text: err?.response?.data?.detail || "Failed to delete job",
            });
        } finally {
            setActionLoading("");
        }
    };

    const handleStatusToggle = async (job) => {
        const currentStatus = job.status || "active";
        const nextStatus = currentStatus === "active" ? "closed" : "active";

        try {
            setActionLoading(job._id);

            const res = await updateEmployerJob(job._id, {
                status: nextStatus,
            });

            setJobs((prev) =>
                prev.map((item) => (item._id === job._id ? res.job : item))
            );

            setToast({
                type: "success",
                text: `Job marked as ${nextStatus}.`,
            });
        } catch (err) {
            setToast({
                type: "error",
                text: err?.response?.data?.detail || "Failed to update job status",
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
                                toast.type === "success"
                                    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                                    : "border-red-400/30 bg-red-500/15 text-red-200"
                            }`}
                        >
                            {toast.type === "success" ? (
                                <CheckCircle2 className="mt-0.5 shrink-0" size={21} />
                            ) : (
                                <AlertCircle className="mt-0.5 shrink-0" size={21} />
                            )}

                            <div>
                                <p className="font-bold">
                                    {toast.type === "success" ? "Success" : "Error"}
                                </p>
                                <p className="text-sm opacity-90">{toast.text}</p>
                            </div>
                        </div>
                    </div>
                )}

                {viewingJob && (
                    <JobViewModal
                        job={viewingJob}
                        onClose={() => setViewingJob(null)}
                        onEdit={() => {
                            openEditModal(viewingJob);
                            setViewingJob(null);
                        }}
                    />
                )}

                {editingJob && (
                    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                        <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-orange-400/20 bg-slate-950 p-5 shadow-2xl sm:p-6">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-300">
                                        Edit Posted Job
                                    </p>
                                    <h2 className="mt-2 text-2xl font-black text-white">
                                        Update Job Details
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setEditingJob(null)}
                                    className="rounded-2xl border border-slate-700 p-2 text-slate-300 hover:border-red-400 hover:text-red-300"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateJob} className="grid gap-4 md:grid-cols-2">
                                <input name="title" value={editingJob.title || ""} onChange={handleEditChange} className={inputClass} placeholder="Job Title" required />
                                <input name="company" value={editingJob.company || ""} onChange={handleEditChange} className={inputClass} placeholder="Company" />
                                <input name="location" value={editingJob.location || ""} onChange={handleEditChange} className={inputClass} placeholder="Location" />
                                <input name="salary" value={editingJob.salary || ""} onChange={handleEditChange} className={inputClass} placeholder="Salary" />
                                <input name="experience" value={editingJob.experience || ""} onChange={handleEditChange} className={inputClass} placeholder="Experience" />

                                <select name="jobType" value={editingJob.jobType || "Full-time"} onChange={handleEditChange} className={inputClass}>
                                    <option className="bg-slate-950">Full-time</option>
                                    <option className="bg-slate-950">Part-time</option>
                                    <option className="bg-slate-950">Internship</option>
                                    <option className="bg-slate-950">Contract</option>
                                    <option className="bg-slate-950">Freelance</option>
                                </select>

                                <select name="workMode" value={editingJob.workMode || "On-site"} onChange={handleEditChange} className={inputClass}>
                                    <option className="bg-slate-950">On-site</option>
                                    <option className="bg-slate-950">Remote</option>
                                    <option className="bg-slate-950">Hybrid</option>
                                </select>

                                <select name="status" value={editingJob.status || "active"} onChange={handleEditChange} className={inputClass}>
                                    <option className="bg-slate-950" value="active">Active</option>
                                    <option className="bg-slate-950" value="closed">Closed</option>
                                </select>

                                <input name="skills" value={editingJob.skills || ""} onChange={handleEditChange} className={`${inputClass} md:col-span-2`} placeholder="Skills: React, Python, SQL" />

                                <textarea name="description" rows="4" value={editingJob.description || ""} onChange={handleEditChange} className={`${textAreaClass} md:col-span-2`} placeholder="Description" />

                                <textarea name="requirements" rows="3" value={editingJob.requirements || ""} onChange={handleEditChange} className={`${textAreaClass} md:col-span-2`} placeholder="Requirements" />

                                <textarea name="responsibilities" rows="3" value={editingJob.responsibilities || ""} onChange={handleEditChange} className={`${textAreaClass} md:col-span-2`} placeholder="Responsibilities" />

                                <input name="applyLink" value={editingJob.applyLink || ""} onChange={handleEditChange} className={inputClass} placeholder="Apply Link" />
                                <input name="deadline" type="date" value={editingJob.deadline || ""} onChange={handleEditChange} className={inputClass} />
                                <input name="hrEmail" value={editingJob.hrEmail || ""} onChange={handleEditChange} className={inputClass} placeholder="HR Email" />
                                <input name="hrPhone" value={editingJob.hrPhone || ""} onChange={handleEditChange} className={inputClass} placeholder="HR Phone" />

                                <button
                                    type="submit"
                                    disabled={actionLoading === editingJob._id}
                                    className="md:col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 via-cyan-400 to-blue-500 px-6 py-3 font-black text-slate-950 disabled:opacity-60"
                                >
                                    <Save size={18} />
                                    {actionLoading === editingJob._id ? "Updating..." : "Save Changes"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                <div className="rounded-[2rem] border border-orange-400/20 bg-slate-950/80 p-6 shadow-2xl">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-400/30 bg-orange-500/10">
                                <Cpu className="text-orange-300" size={28} />
                            </div>

                            <div>
                                <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-orange-300">
                                    <Sparkles size={16} />
                                    Job Control Center
                                </p>

                                <h1 className="mt-2 text-3xl font-black text-white">
                                    Manage Jobs
                                </h1>

                                <p className="mt-2 text-sm text-slate-400">
                                    View, edit, download JD PDF, close or delete posted jobs.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => loadJobs(true)}
                            disabled={refreshing}
                            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-bold text-slate-200 hover:border-orange-400/60 disabled:opacity-60"
                        >
                            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                            {refreshing ? "Refreshing..." : "Refresh Jobs"}
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard icon={Briefcase} title="Total Jobs" value={stats.total} color="text-orange-300" />
                    <StatCard icon={Activity} title="Active Jobs" value={stats.active} color="text-cyan-300" />
                    <StatCard icon={Clock} title="Closed Jobs" value={stats.closed} color="text-red-300" />
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-4 shadow-xl">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 lg:min-w-[360px]">
                            <Search className="text-orange-300" size={18} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search jobs..."
                                className="w-full bg-transparent text-white outline-none"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {["all", "active", "closed"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`rounded-2xl border px-4 py-2 font-bold capitalize ${
                                        statusFilter === status
                                            ? "border-orange-400 bg-orange-500/10 text-orange-200"
                                            : "border-slate-700 text-slate-300 hover:border-orange-400/50 hover:text-orange-200"
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-4 shadow-xl">
                    {loading ? (
                        <div className="py-20 text-center text-slate-400">
                            Loading your posted jobs...
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="py-20 text-center text-slate-400">
                            No jobs found.
                        </div>
                    ) : (
                        <div className="grid gap-4 xl:grid-cols-2">
                            {filteredJobs.map((job) => {
                                const status = job.status || "active";
                                const skills = Array.isArray(job.skills)
                                    ? job.skills
                                    : typeof job.skills === "string"
                                    ? job.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
                                    : [];

                                return (
                                    <div
                                        key={job._id}
                                        className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-5 transition hover:border-orange-400/30"
                                    >
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="text-xl font-black text-white">
                                                        {job.title || "Untitled Job"}
                                                    </h2>

                                                    <span
                                                        className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${
                                                            status === "active"
                                                                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                                                                : "border-red-400/30 bg-red-500/10 text-red-300"
                                                        }`}
                                                    >
                                                        {status}
                                                    </span>
                                                </div>

                                                <p className="text-slate-400">
                                                    {job.company || "Company not added"}
                                                </p>
                                            </div>

                                            <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                                                <span className="flex items-center gap-2">
                                                    <MapPin size={16} />
                                                    {job.location || "Location not added"}
                                                </span>

                                                <span className="flex items-center gap-2">
                                                    <IndianRupee size={16} />
                                                    {job.salary || "Salary not added"}
                                                </span>

                                                <span className="flex items-center gap-2">
                                                    <Briefcase size={16} />
                                                    {job.jobType || "Job type not added"}
                                                </span>

                                                <span className="flex items-center gap-2">
                                                    <Laptop size={16} />
                                                    {job.workMode || "Work mode not added"}
                                                </span>
                                            </div>

                                            {skills.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {skills.map((skill) => (
                                                        <span
                                                            key={skill}
                                                            className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-200"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="grid gap-3 border-t border-slate-800 pt-4 sm:grid-cols-5">
                                                <ActionButton
                                                    icon={Eye}
                                                    label="View"
                                                    variant="view"
                                                    onClick={() => setViewingJob(job)}
                                                />

                                                <ActionButton
                                                    icon={Download}
                                                    label="PDF"
                                                    variant="pdf"
                                                    onClick={() => downloadJobPdf(job)}
                                                />

                                                <ActionButton
                                                    icon={Edit3}
                                                    label="Edit"
                                                    variant="edit"
                                                    onClick={() => openEditModal(job)}
                                                />

                                                <ActionButton
                                                    icon={status === "active" ? ToggleRight : ToggleLeft}
                                                    label={status === "active" ? "Close" : "Open"}
                                                    variant={status === "active" ? "toggleClose" : "toggleOpen"}
                                                    onClick={() => handleStatusToggle(job)}
                                                />

                                                <ActionButton
                                                    icon={Trash2}
                                                    label="Delete"
                                                    variant="delete"
                                                    onClick={() => handleDelete(job._id)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

function StatCard({ icon: Icon, title, value, color }) {
    return (
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/75 p-5 shadow-xl">
            <Icon className={`mb-3 ${color}`} size={26} />
            <p className="text-sm text-slate-400">{title}</p>
            <h2 className="mt-1 text-3xl font-black">{value}</h2>
        </div>
    );
}

function ActionButton({ icon: Icon, label, onClick, variant = "default" }) {
    const styles = {
        view: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400",
        pdf: "border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 hover:border-orange-400",
        edit: "border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400",
        toggleOpen:
            "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400",
        toggleClose:
            "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-400",
        delete:
            "border-red-600/30 bg-red-600/10 text-red-400 hover:bg-red-600/20 hover:border-red-500",
        default:
            "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-orange-400 hover:text-orange-300",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 font-bold transition-all duration-200 hover:scale-[1.02] ${styles[variant]}`}
        >
            <Icon size={18} />
            {label}
        </button>
    );
}