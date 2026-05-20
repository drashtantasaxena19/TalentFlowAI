import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Briefcase,
    MapPin,
    IndianRupee,
    Eye,
    Users,
    Filter,
    RotateCcw,
    Building2,
    Laptop,
    X,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Clock,
    Layers,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { getPublicJobs } from "../../services/jobsApi";
import { useAuth } from "../../context/AuthContext";

const emptyFilters = {
    search: "",
    location: "",
    jobType: "",
    workMode: "",
    source: "",
    experience: "",
};

const JOBS_PER_PAGE = 12;

export default function PublicJobs() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [jobs, setJobs] = useState([]);
    const [filters, setFilters] = useState(emptyFilters);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedJob, setSelectedJob] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const loadJobs = async (customFilters = filters) => {
        try {
            setLoading(true);
            setError("");

            const res = await getPublicJobs({
                search: customFilters.search,
                location: customFilters.location,
                jobType: customFilters.jobType,
                workMode: customFilters.workMode,
                source: customFilters.source,
                experience: customFilters.experience,
                limit: 500,
            });

            const list = res?.jobs || res?.data || [];
            setJobs(Array.isArray(list) ? list : []);
            setCurrentPage(1);
        } catch (err) {
            setError(err?.response?.data?.detail || "Could not load jobs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJobs(emptyFilters);
    }, []);

    const filteredJobs = useMemo(() => {
        const q = filters.search.trim().toLowerCase();

        return jobs.filter((job) => {
            const skillsText = Array.isArray(job.skills) ? job.skills.join(" ") : job.skills || "";
            const haystack = [
                job.title,
                job.company,
                job.location,
                job.salary,
                job.jobType,
                job.workMode,
                job.source,
                job.experience,
                job.description,
                skillsText,
            ].join(" ").toLowerCase();

            const searchMatch = q ? haystack.includes(q) : true;
            const locationMatch = filters.location
                ? String(job.location || "").toLowerCase().includes(filters.location.toLowerCase())
                : true;
            const jobTypeMatch = filters.jobType
                ? String(job.jobType || "").toLowerCase() === filters.jobType.toLowerCase()
                : true;
            const workModeMatch = filters.workMode
                ? String(job.workMode || "").toLowerCase() === filters.workMode.toLowerCase()
                : true;
            const sourceMatch = filters.source
                ? String(job.source || "").toLowerCase() === filters.source.toLowerCase()
                : true;
            const experienceMatch = filters.experience
                ? String(job.experience || "").toLowerCase().includes(filters.experience.toLowerCase())
                : true;

            return searchMatch && locationMatch && jobTypeMatch && workModeMatch && sourceMatch && experienceMatch;
        });
    }, [jobs, filters]);

    const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));

    const paginatedJobs = useMemo(() => {
        const start = (currentPage - 1) * JOBS_PER_PAGE;
        return filteredJobs.slice(start, start + JOBS_PER_PAGE);
    }, [filteredJobs, currentPage]);

    const uniqueValues = (key) => {
        return [...new Set(jobs.map((job) => job[key]).filter(Boolean))].slice(0, 80);
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const handleReset = () => {
        setFilters(emptyFilters);
        setCurrentPage(1);
        loadJobs(emptyFilters);
    };

    const handleApplyFilters = () => {
        loadJobs(filters);
    };

    const handleViewJob = (job) => {
        setSelectedJob(job);
    };

    const handleApply = (job) => {
        if (!isAuthenticated) {
            navigate("/login", {
                state: {
                    redirectTo: "/jobs",
                },
            });
            return;
        }

        const applyUrl = job.applyLink || job.link || job.url;
        if (applyUrl) {
            window.open(applyUrl, "_blank", "noopener,noreferrer");
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 6;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let page = start; page <= end; page += 1) {
            pages.push(page);
        }

        return pages;
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />

            <main className="px-4 pt-28 pb-16 sm:px-5">
                <section className="mx-auto max-w-7xl">
                    <div className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 p-5 shadow-xl md:p-8">
                        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">
                            <Briefcase size={18} />
                            Public Job Explorer
                        </p>

                        <h1 className="mt-3 text-3xl font-black md:text-5xl">
                            Browse Jobs From TalentFlow AI
                        </h1>

                        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
                            Search jobs from database without login. View job details, application count, and apply when ready.
                        </p>
                    </div>

                    <div className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-900/75 p-4 shadow-xl md:p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-slate-300">
                                <Filter size={20} className="text-cyan-300" />
                                <h2 className="font-bold">Search & Filters</h2>
                            </div>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-bold text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
                            >
                                <RotateCcw size={16} />
                                Reset
                            </button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                            <div className="xl:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">
                                <Search size={18} className="text-cyan-300" />
                                <input
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange("search", e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleApplyFilters();
                                    }}
                                    placeholder="Search title, skill, company..."
                                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                                />
                            </div>

                            <input
                                value={filters.location}
                                onChange={(e) => handleFilterChange("location", e.target.value)}
                                placeholder="Location"
                                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                            />

                            <select
                                value={filters.jobType}
                                onChange={(e) => handleFilterChange("jobType", e.target.value)}
                                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                            >
                                <option value="">Job Type</option>
                                {uniqueValues("jobType").map((value) => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </select>

                            <select
                                value={filters.workMode}
                                onChange={(e) => handleFilterChange("workMode", e.target.value)}
                                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                            >
                                <option value="">Work Mode</option>
                                {uniqueValues("workMode").map((value) => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={handleApplyFilters}
                                className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-400"
                            >
                                Apply Filters
                            </button>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <select
                                value={filters.source}
                                onChange={(e) => handleFilterChange("source", e.target.value)}
                                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                            >
                                <option value="">Source</option>
                                {uniqueValues("source").map((value) => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </select>

                            <input
                                value={filters.experience}
                                onChange={(e) => handleFilterChange("experience", e.target.value)}
                                placeholder="Experience e.g. Fresher, 2 years"
                                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                            />

                            <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400">
                                Showing <span className="font-black text-cyan-300">{filteredJobs.length}</span> job(s)
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-300">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-900/75 p-12 text-center text-slate-400">
                            Loading jobs from database...
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-900/75 p-12 text-center">
                            <Briefcase className="mx-auto mb-4 text-cyan-300" size={44} />
                            <h2 className="text-2xl font-black">No jobs found</h2>
                            <p className="mt-2 text-slate-400">Jobs will show here automatically. Try reset if filters are too strict.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {paginatedJobs.map((job) => (
                                    <PublicJobCard
                                        key={job._id || job.id || job.link}
                                        job={job}
                                        onView={() => handleViewJob(job)}
                                        onApply={() => handleApply(job)}
                                    />
                                ))}
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                pageNumbers={getPageNumbers()}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </section>
            </main>

            {selectedJob && (
                <JobDetailsModal
                    job={selectedJob}
                    onClose={() => setSelectedJob(null)}
                    onApply={() => handleApply(selectedJob)}
                />
            )}

            <Footer />
        </div>
    );
}

function PublicJobCard({ job, onView, onApply }) {
    const skills = Array.isArray(job.skills)
        ? job.skills
        : typeof job.skills === "string"
        ? job.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
        : [];

    const applicationCount = job.applicationCount ?? job.applicationsCount ?? job.appliedCount ?? job.totalApplications ?? 0;
    const viewCount = job.viewCount ?? job.views ?? job.totalViews ?? 0;

    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-4 shadow-lg transition hover:-translate-y-1 hover:border-cyan-400/40">
            <div className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="line-clamp-2 text-lg font-black text-white">
                            {job.title || "Untitled Job"}
                        </h2>

                        <p className="mt-1 flex items-center gap-1 text-sm text-slate-400">
                            <Building2 size={14} />
                            <span className="line-clamp-1">{job.company || "Company not added"}</span>
                        </p>
                    </div>

                    <span className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-300">
                        {job.source || "TalentFlow"}
                    </span>
                </div>

                <div className="space-y-1.5 text-sm text-slate-400">
                    <p className="flex items-center gap-2">
                        <MapPin size={15} />
                        <span className="line-clamp-1">{job.location || "Location not added"}</span>
                    </p>

                    <p className="flex items-center gap-2">
                        <IndianRupee size={15} />
                        <span className="line-clamp-1">{job.salary || "Not disclosed"}</span>
                    </p>

                    <p className="flex items-center gap-2">
                        <Laptop size={15} />
                        <span>{job.workMode || "Work mode"}</span>
                    </p>
                </div>

                <p className="line-clamp-2 text-sm leading-relaxed text-slate-400">
                    {job.description || job.summary || "No description available."}
                </p>

                {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {skills.slice(0, 5).map((skill) => (
                            <span
                                key={skill}
                                className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1">
                        <Eye size={13} />
                        {viewCount} views
                    </span>

                    <span className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1">
                        <Users size={13} />
                        {applicationCount} applicants
                    </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={onView}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2.5 text-sm font-bold text-cyan-300 hover:bg-cyan-500/20"
                    >
                        <Eye size={16} />
                        View Job
                    </button>

                    <button
                        type="button"
                        onClick={onApply}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-3 py-2.5 text-sm font-black text-slate-950 hover:bg-cyan-400"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}

function Pagination({ currentPage, totalPages, pageNumbers, onPageChange }) {
    if (totalPages <= 1) return null;

    return (
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[2rem] border border-slate-800 bg-slate-900/75 p-4 sm:flex-row">
            <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-40 hover:border-cyan-400 hover:text-cyan-300"
            >
                <ChevronLeft size={17} />
                Previous
            </button>

            <div className="flex flex-wrap justify-center gap-2">
                {currentPage > 3 && (
                    <>
                        <PageButton page={1} currentPage={currentPage} onPageChange={onPageChange} />
                        <span className="px-2 py-2 text-slate-500">...</span>
                    </>
                )}

                {pageNumbers.map((page) => (
                    <PageButton
                        key={page}
                        page={page}
                        currentPage={currentPage}
                        onPageChange={onPageChange}
                    />
                ))}

                {currentPage < totalPages - 3 && (
                    <>
                        <span className="px-2 py-2 text-slate-500">...</span>
                        <PageButton page={totalPages} currentPage={currentPage} onPageChange={onPageChange} />
                    </>
                )}
            </div>

            <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-40 hover:border-cyan-400 hover:text-cyan-300"
            >
                Next
                <ChevronRight size={17} />
            </button>
        </div>
    );
}

function PageButton({ page, currentPage, onPageChange }) {
    const active = page === currentPage;

    return (
        <button
            type="button"
            onClick={() => onPageChange(page)}
            className={`h-10 min-w-10 rounded-2xl px-3 text-sm font-black transition ${
                active
                    ? "bg-cyan-500 text-slate-950"
                    : "border border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
            }`}
        >
            {page}
        </button>
    );
}

function JobDetailsModal({ job, onClose, onApply }) {
    const skills = Array.isArray(job.skills)
        ? job.skills
        : typeof job.skills === "string"
        ? job.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
        : [];

    const applicationCount = job.applicationCount ?? job.applicationsCount ?? job.appliedCount ?? job.totalApplications ?? 0;
    const viewCount = job.viewCount ?? job.views ?? job.totalViews ?? 0;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-slate-800 bg-slate-950 p-5 shadow-2xl">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                            <Briefcase size={16} />
                            Job Details
                        </p>

                        <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
                            {job.title || "Untitled Job"}
                        </h2>

                        <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                                <Building2 size={15} />
                                {job.company || "Company not added"}
                            </span>

                            <span className="flex items-center gap-1">
                                <MapPin size={15} />
                                {job.location || "Location not added"}
                            </span>
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:border-red-400 hover:text-red-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    <InfoBox icon={IndianRupee} label="Salary" value={job.salary || "Not disclosed"} />
                    <InfoBox icon={Laptop} label="Work Mode" value={job.workMode || "Not added"} />
                    <InfoBox icon={Briefcase} label="Job Type" value={job.jobType || "Not added"} />
                    <InfoBox icon={Clock} label="Experience" value={job.experience || "Not added"} />
                </div>

                <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-400">
                    <span className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5">
                        <Eye size={15} />
                        {viewCount} views
                    </span>

                    <span className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5">
                        <Users size={15} />
                        {applicationCount} applicants
                    </span>

                    <span className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-cyan-300">
                        <Layers size={15} />
                        {job.source || "TalentFlow"}
                    </span>
                </div>

                {skills.length > 0 && (
                    <div className="mt-5">
                        <h3 className="mb-3 text-lg font-black text-white">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill) => (
                                <span
                                    key={skill}
                                    className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
                    <h3 className="mb-3 text-lg font-black text-white">Job Description</h3>
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
                        {job.description || job.summary || "No description available."}
                    </p>
                </div>

                {(job.requirements || job.responsibilities) && (
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                        {job.requirements && (
                            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
                                <h3 className="mb-3 text-lg font-black text-white">Requirements</h3>
                                <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
                                    {Array.isArray(job.requirements) ? job.requirements.join("\n") : job.requirements}
                                </p>
                            </div>
                        )}

                        {job.responsibilities && (
                            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
                                <h3 className="mb-3 text-lg font-black text-white">Responsibilities</h3>
                                <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
                                    {Array.isArray(job.responsibilities) ? job.responsibilities.join("\n") : job.responsibilities}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="sticky bottom-0 mt-6 flex flex-col gap-3 border-t border-slate-800 bg-slate-950 pt-4 sm:flex-row">
                    <button
                        type="button"
                        onClick={onApply}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-black text-slate-950 hover:bg-cyan-400"
                    >
                        Apply Now
                        <ExternalLink size={18} />
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-bold text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function InfoBox({ icon: Icon, label, value }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <Icon className="mb-2 text-cyan-300" size={20} />
            <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
            <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-200">{value}</p>
        </div>
    );
}