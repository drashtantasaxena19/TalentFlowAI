import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import {
    Briefcase,
    MapPin,
    IndianRupee,
    Bookmark,
    BookmarkCheck,
    Phone,
    Mail,
    MessageCircle,
    ExternalLink,
    Eye,
    Download,
    CheckCircle2,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { applyToJob, checkAppliedJob } from "../../services/jobsApi";

export default function JobCard({
    job,
    isSaved = false,
    onSave,
    applied: appliedProp = false,
    alreadyApplied = false,
    onApplied,
}) {
    const [applying, setApplying] = useState(false);
    const [checkingApplied, setCheckingApplied] = useState(false);
    const [isApplied, setIsApplied] = useState(Boolean(appliedProp || alreadyApplied));
    const [message, setMessage] = useState("");

    const normalizeUrl = (url) => {
        if (!url || typeof url !== "string") return "";
        const cleanUrl = url.trim();
        if (!cleanUrl) return "";
        if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
            return cleanUrl;
        }
        return `https://${cleanUrl}`;
    };

    const getFinalApplyLink = () => {
        return normalizeUrl(
            job.applyLink ||
            job.applicationLink ||
            job.applicationUrl ||
            job.applyUrl ||
            job.apply_url ||
            job.application_url ||
            job.jobUrl ||
            job.job_url ||
            job.url ||
            job.link ||
            ""
        );
    };

    const getJobId = () => {
        return String(
            job._id ||
            job.id ||
            job.jobId ||
            job.link ||
            job.applyLink ||
            `${job.title || job.jobTitle || "job"}-${job.company || "company"}`
        );
    };

    const title = job.title || job.jobTitle || "Untitled Job";
    const finalApplyLink = getFinalApplyLink();
    const jobId = getJobId();

    useEffect(() => {
        let active = true;

        const checkStatus = async () => {
            if (!jobId) return;

            try {
                setCheckingApplied(true);
                const res = await checkAppliedJob(jobId);

                if (active) {
                    setIsApplied(Boolean(res?.applied || res?.alreadyApplied));
                }
            } catch (error) {
                if (active) {
                    setIsApplied(Boolean(appliedProp || alreadyApplied));
                }
            } finally {
                if (active) {
                    setCheckingApplied(false);
                }
            }
        };

        checkStatus();

        return () => {
            active = false;
        };
    }, [jobId, appliedProp, alreadyApplied]);

    const handleApply = async () => {
        if (!finalApplyLink) {
            setMessage("Apply link is missing for this job.");
            return;
        }

        if (isApplied) {
            return;
        }

        try {
            setApplying(true);
            setMessage("");

            await applyToJob({
                jobId,
                title,
                company: job.company || "",
                location: job.location || "",
                source: job.source || "",
                applyLink: finalApplyLink,
                employerEmail: job.employerEmail || job.employer_email || "",
                skills: job.skills || job.requiredSkills || job.jobSkills || [],
                description: job.description || job.jobDescription || job.reason || "",
                experience: job.experience || job.jobExperience || "",
            });

            setIsApplied(true);
            setMessage("Application tracked successfully.");

            if (typeof onApplied === "function") {
                onApplied(jobId);
            }

            window.open(finalApplyLink, "_blank", "noopener,noreferrer");
        } catch (error) {
            console.error("Apply failed:", error);

            if (
                error?.response?.data?.alreadyApplied ||
                error?.response?.data?.applied
            ) {
                setIsApplied(true);
                setMessage("Application already tracked.");
                return;
            }

            setMessage(error?.response?.data?.detail || "Failed to apply. Please try again.");
        } finally {
            setApplying(false);
        }
    };

    const handleDownloadJD = () => {
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const primary = [124, 58, 237];
        const dark = [15, 23, 42];
        const muted = [100, 116, 139];
        const lightBg = [241, 245, 249];

        let y = 22;
        let pageNo = 1;

        const safeText = (value, fallback = "Not specified") => {
            if (Array.isArray(value)) {
                return value.filter(Boolean).join(", ") || fallback;
            }
            return value || fallback;
        };

        const skills = job.requiredSkills || job.skills || job.jobSkills || "Not specified";

        const description =
            job.description ||
            job.jobDescription ||
            job.reason ||
            "Description not available.";

        const addHeader = () => {
            doc.setFillColor(...dark);
            doc.rect(0, 0, pageWidth, 34, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(20);
            doc.text("TalentFlow AI", 14, 14);

            doc.setTextColor(...primary);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text("Official Job Description", 14, 23);
        };

        const addFooter = () => {
            doc.setDrawColor(...primary);
            doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

            doc.setTextColor(...muted);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`Generated by TalentFlow AI | Page ${pageNo}`, 14, pageHeight - 8);
        };

        const checkPage = (space = 16) => {
            if (y + space > pageHeight - 24) {
                addFooter();
                doc.addPage();
                pageNo += 1;
                addHeader();
                y = 46;
            }
        };

        const sectionTitle = (heading) => {
            checkPage(16);

            doc.setFillColor(...primary);
            doc.roundedRect(14, y - 6, pageWidth - 28, 11, 2, 2, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text(heading, 18, y + 1);

            y += 16;
        };

        const row = (label, value) => {
            checkPage(12);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(...dark);
            doc.setFontSize(10.5);
            doc.text(`${label}:`, 14, y);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(...dark);

            const wrapped = doc.splitTextToSize(String(safeText(value)), 132);

            wrapped.forEach((line, index) => {
                if (index > 0) y += 6;
                checkPage(8);
                doc.text(line, 58, y);
            });

            y += 8;
        };

        const paragraph = (text) => {
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...dark);
            doc.setFontSize(10.5);

            const wrapped = doc.splitTextToSize(String(safeText(text)), pageWidth - 28);

            wrapped.forEach((line) => {
                checkPage(8);
                doc.text(line, 14, y);
                y += 6;
            });

            y += 3;
        };

        const skillBox = (value) => {
            const list = Array.isArray(value)
                ? value.filter(Boolean)
                : String(value || "")
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean);

            const finalList = list.length ? list : ["Not specified"];

            finalList.forEach((item) => {
                checkPage(12);

                doc.setFillColor(...lightBg);
                doc.roundedRect(14, y - 5, pageWidth - 28, 10, 2, 2, "F");

                doc.setTextColor(...dark);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.text(String(item), 18, y + 1);

                y += 12;
            });

            y += 2;
        };

        addHeader();
        y = 46;

        doc.setTextColor(...dark);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text(title, 14, y);

        y += 9;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(...muted);
        doc.text(job.company || "Company not specified", 14, y);

        y += 14;

        sectionTitle("JOB INFORMATION");
        row("Job Title", title);
        row("Company", job.company || "Company not specified");
        row("Location", job.location);
        row("Salary", job.salary || "Not disclosed");
        row("Experience", job.experience || job.jobExperience);
        row("Job Type", job.jobType || job.job_type);
        row("Work Mode", job.workMode || job.work_mode);
        row("Deadline", job.deadline);
        row("Job Source", job.source || "TalentFlow AI");

        sectionTitle("JOB DESCRIPTION");
        paragraph(description);

        sectionTitle("REQUIREMENTS");
        paragraph(job.requirements || "Not specified");

        sectionTitle("RESPONSIBILITIES");
        paragraph(job.responsibilities || "Not specified");

        sectionTitle("REQUIRED SKILLS");
        skillBox(skills);

        sectionTitle("APPLICATION DETAILS");
        row("Apply Link", finalApplyLink || "Not available");
        row("HR Email", job.hrEmail || job.hr_email || "Not available");
        row("HR Phone", job.hrPhone || job.hr_phone || "Not available");

        addFooter();

        const fileName = `${title}-${job.company || "company"}`
            .replace(/[^a-z0-9]/gi, "-")
            .toLowerCase();

        doc.save(`${fileName}-jd.pdf`);
    };

    const isApplyDisabled = applying || checkingApplied || isApplied || !finalApplyLink;

    return (
        <div className="rounded-[2rem] border border-violet-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/20 p-6 hover:border-cyan-400/40 transition-all duration-300 shadow-xl shadow-violet-950/10 overflow-hidden">

            <div className="flex flex-col xl:flex-row gap-6">

                {/* LEFT */}

                <div className="flex-1 min-w-0">

                    <div className="flex items-start gap-4">

                        <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/20 flex items-center justify-center">
                            <Briefcase
                                className="text-cyan-300"
                                size={24}
                            />
                        </div>

                        <div className="min-w-0 flex-1">

                            <h2 className="text-2xl font-bold text-white leading-tight break-words">
                                {title}
                            </h2>

                            <p className="text-cyan-300 mt-1 font-medium">
                                {job.company || "Company not specified"}
                            </p>

                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-400">

                                <div className="flex items-center gap-2">
                                    <MapPin
                                        size={16}
                                        className="text-fuchsia-300"
                                    />
                                    <span>
                                        {job.location || "Not specified"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <IndianRupee
                                        size={16}
                                        className="text-fuchsia-300"
                                    />
                                    <span>
                                        {job.salary || "Not disclosed"}
                                    </span>
                                </div>

                            </div>

                            {job.reason && (
                                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                                        {job.reason}
                                    </p>
                                </div>
                            )}

                            {message && (
                                <p
                                    className={`mt-4 text-sm font-semibold ${isApplied
                                        ? "text-emerald-300"
                                        : "text-yellow-300"
                                        }`}
                                >
                                    {message}
                                </p>
                            )}

                        </div>
                    </div>
                </div>

                {/* RIGHT */}

                <div className="xl:w-[290px] shrink-0 flex flex-col gap-4">

                    {/* MATCH */}

                    <div className="rounded-[2rem] border border-cyan-500/20 bg-slate-950/70 p-5 text-center">

                        <p className="text-slate-400 text-sm uppercase tracking-wide">
                            AI Match
                        </p>

                        <h3 className="text-5xl font-black text-emerald-400 mt-2">
                            {job.match || "N/A"}
                        </h3>

                        {job.source && (
                            <p className="text-xs text-slate-500 mt-3">
                                {job.source}
                            </p>
                        )}
                    </div>

                    {/* ACTIONS */}

                    <div className="flex flex-col gap-3">

                        <button
                            type="button"
                            onClick={handleApply}
                            disabled={isApplyDisabled}
                            className={`w-full py-3.5 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${isApplied
                                ? "bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 cursor-not-allowed"
                                : !finalApplyLink
                                    ? "bg-yellow-500/10 border border-yellow-400/30 text-yellow-300 cursor-not-allowed"
                                    : "bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 text-slate-950 hover:scale-[1.02]"
                                }`}
                        >
                            {applying || checkingApplied ? (
                                <>
                                    <Loader2
                                        size={18}
                                        className="animate-spin"
                                    />
                                    {checkingApplied
                                        ? "Checking..."
                                        : "Applying..."}
                                </>
                            ) : isApplied ? (
                                <>
                                    <CheckCircle2 size={18} />
                                    Applied
                                </>
                            ) : (
                                <>
                                    Apply Now
                                    <ExternalLink size={18} />
                                </>
                            )}
                        </button>

                        <Link
                            to="/candidate/job-details"
                            state={{ job }}
                            className="w-full py-3.5 rounded-2xl border border-violet-400/30 text-violet-300 hover:bg-violet-400 hover:text-slate-950 transition-all duration-300 font-bold flex items-center justify-center gap-2"
                        >
                            <Eye size={18} />
                            View Details
                        </Link>

                        <button
                            type="button"
                            onClick={handleDownloadJD}
                            className="w-full py-3.5 rounded-2xl border border-fuchsia-400/30 text-fuchsia-300 hover:bg-fuchsia-400 hover:text-slate-950 transition-all duration-300 font-bold flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            Download JD
                        </button>

                        <button
                            type="button"
                            onClick={onSave}
                            className={`w-full py-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-center gap-2 font-bold ${isSaved
                                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                : "border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
                                }`}
                        >
                            {isSaved ? (
                                <BookmarkCheck size={18} />
                            ) : (
                                <Bookmark size={18} />
                            )}

                            {isSaved
                                ? "Saved"
                                : "Save Job"}
                        </button>

                    </div>

                    {/* CONTACT */}

                    <div className="grid grid-cols-3 gap-3">

                        <a
                            href={job.chatLink || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="h-12 rounded-2xl border border-slate-700 flex items-center justify-center text-slate-300 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-300"
                        >
                            <MessageCircle size={18} />
                        </a>

                        <a
                            href={`tel:${job.hrPhone || ""}`}
                            className="h-12 rounded-2xl border border-slate-700 flex items-center justify-center text-slate-300 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-300"
                        >
                            <Phone size={18} />
                        </a>

                        <a
                            href={`mailto:${job.hrEmail || ""}`}
                            className="h-12 rounded-2xl border border-slate-700 flex items-center justify-center text-slate-300 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-300"
                        >
                            <Mail size={18} />
                        </a>

                    </div>

                </div>
            </div>
        </div>
    )
}