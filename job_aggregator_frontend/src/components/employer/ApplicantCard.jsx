import { useState } from "react";
import {
    Mail,
    CalendarDays,
    Eye,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Target,
    XCircle,
    Clock,
    UserCheck,
    Brain,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { updateApplicantStatus } from "../../services/employerApi";

function formatDate(value) {
    if (!value) return "Date not available";

    try {
        return new Date(value).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return String(value);
    }
}

function getScoreStyle(score) {
    if (score >= 85) return "text-emerald-300";
    if (score >= 70) return "text-cyan-300";
    if (score >= 50) return "text-orange-300";
    return "text-red-300";
}

function getStatusStyle(status) {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "shortlisted") {
        return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
    }

    if (normalized === "rejected") {
        return "border-red-400/30 bg-red-500/10 text-red-300";
    }

    if (normalized === "interview") {
        return "border-cyan-400/30 bg-cyan-500/10 text-cyan-300";
    }

    return "border-slate-700 bg-slate-900 text-slate-300";
}

export default function ApplicantCard({
    applicant,
    onStatusUpdated,
}) {
    const [loadingAction, setLoadingAction] = useState("");
    const [expanded, setExpanded] = useState(false);

    const name =
        applicant.name ||
        applicant.candidateName ||
        applicant.fullName ||
        "Unknown Candidate";

    const email =
        applicant.email ||
        applicant.candidateEmail ||
        "Email not available";

    const role =
        applicant.role ||
        applicant.detectedRole ||
        applicant.currentRole ||
        "Candidate";

    const jobTitle = applicant.jobTitle || "Unknown Job";
    const score = Number(applicant.matchScore || applicant.score || 0);

    const skills = Array.isArray(applicant.skills)
        ? applicant.skills
        : typeof applicant.skills === "string"
        ? applicant.skills
              .split(",")
              .map((skill) => skill.trim())
              .filter(Boolean)
        : [];

    const matchedSkills = Array.isArray(applicant.matchedSkills)
        ? applicant.matchedSkills
        : [];

    const missingSkills = Array.isArray(applicant.missingSkills)
        ? applicant.missingSkills
        : [];

    const strengths = Array.isArray(applicant.strengths)
        ? applicant.strengths
        : [];

    const weaknesses = Array.isArray(applicant.weaknesses)
        ? applicant.weaknesses
        : [];

    const interviewQuestions = Array.isArray(applicant.interviewQuestions)
        ? applicant.interviewQuestions
        : [];

    const status = applicant.status || applicant.aiStatus || "Under Review";

    const handleStatus = async (statusValue) => {
        try {
            setLoadingAction(statusValue);

            await updateApplicantStatus(applicant._id, statusValue);

            if (typeof onStatusUpdated === "function") {
                onStatusUpdated();
            }
        } catch (error) {
            console.error("Applicant status update failed:", error);
        } finally {
            setLoadingAction("");
        }
    };

    return (
        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-5 transition hover:border-orange-400/30">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-xl font-black text-orange-300">
                        {name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-xl font-black text-white">
                                {name}
                            </h3>

                            <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(
                                    status
                                )}`}
                            >
                                {status}
                            </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-400">
                            {role}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                                <Mail size={14} />
                                {email}
                            </span>

                            <span className="flex items-center gap-1">
                                <CalendarDays size={14} />
                                {formatDate(
                                    applicant.createdAt ||
                                        applicant.appliedDate
                                )}
                            </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-400">
                            Applied for{" "}
                            <span className="font-bold text-orange-200">
                                {jobTitle}
                            </span>
                        </p>

                        {skills.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {skills.slice(0, 8).map((skill) => (
                                    <span
                                        key={skill}
                                        className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-300">
                                    <CheckCircle2 size={16} />
                                    Matched Skills
                                </p>

                                <p className="text-xs leading-relaxed text-slate-300">
                                    {matchedSkills.length
                                        ? matchedSkills.join(", ")
                                        : "No direct matched skills found"}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-3">
                                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-orange-300">
                                    <AlertCircle size={16} />
                                    Missing Skills
                                </p>

                                <p className="text-xs leading-relaxed text-slate-300">
                                    {missingSkills.length
                                        ? missingSkills.join(", ")
                                        : "No major missing skills"}
                                </p>
                            </div>
                        </div>

                        {applicant.aiInsights && (
                            <div className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3">
                                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-cyan-300">
                                    <Brain size={16} />
                                    AI Insight
                                </p>

                                <p className="text-sm leading-relaxed text-slate-300">
                                    {applicant.aiInsights}
                                </p>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setExpanded(!expanded)}
                            className="mt-4 flex items-center gap-2 text-sm font-bold text-orange-300"
                        >
                            {expanded ? (
                                <>
                                    <ChevronUp size={16} />
                                    Hide Deep Analysis
                                </>
                            ) : (
                                <>
                                    <ChevronDown size={16} />
                                    Show Deep Analysis
                                </>
                            )}
                        </button>

                        {expanded && (
                            <div className="mt-4 space-y-4">
                                <div className="grid gap-3 lg:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                                        <p className="mb-2 font-bold text-emerald-300">
                                            Strengths
                                        </p>

                                        <ul className="space-y-1 text-sm text-slate-300">
                                            {strengths.length ? (
                                                strengths.map((item) => (
                                                    <li key={item}>• {item}</li>
                                                ))
                                            ) : (
                                                <li>No major strengths listed</li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                                        <p className="mb-2 font-bold text-orange-300">
                                            Weaknesses
                                        </p>

                                        <ul className="space-y-1 text-sm text-slate-300">
                                            {weaknesses.length ? (
                                                weaknesses.map((item) => (
                                                    <li key={item}>• {item}</li>
                                                ))
                                            ) : (
                                                <li>No major weaknesses listed</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                                    <p className="mb-2 font-bold text-cyan-300">
                                        AI Interview Questions
                                    </p>

                                    <ul className="space-y-2 text-sm text-slate-300">
                                        {interviewQuestions.length ? (
                                            interviewQuestions.map((question) => (
                                                <li key={question}>
                                                    • {question}
                                                </li>
                                            ))
                                        ) : (
                                            <li>No interview questions generated</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 flex-col gap-3 xl:w-[230px] xl:items-end">
                    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-center">
                        <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                            <Target size={14} />
                            AI Match
                        </p>

                        <p
                            className={`mt-2 text-4xl font-black ${getScoreStyle(
                                score
                            )}`}
                        >
                            {score}%
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            {applicant.recommendation ||
                                "Needs Review"}
                        </p>
                    </div>

                    <div className="grid w-full gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                handleStatus("shortlisted")
                            }
                            disabled={!!loadingAction}
                            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/15 px-4 py-2.5 font-bold text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-60"
                        >
                            <UserCheck size={16} />
                            {loadingAction === "shortlisted"
                                ? "Updating..."
                                : "Shortlist"}
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                handleStatus("interview")
                            }
                            disabled={!!loadingAction}
                            className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-500/15 px-4 py-2.5 font-bold text-cyan-300 transition hover:bg-cyan-500/25 disabled:opacity-60"
                        >
                            <Clock size={16} />
                            Interview
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                handleStatus("rejected")
                            }
                            disabled={!!loadingAction}
                            className="flex items-center justify-center gap-2 rounded-2xl bg-red-500/15 px-4 py-2.5 font-bold text-red-300 transition hover:bg-red-500/25 disabled:opacity-60"
                        >
                            <XCircle size={16} />
                            Reject
                        </button>

                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 via-cyan-400 to-blue-500 px-4 py-2.5 font-black text-slate-950 transition hover:scale-[1.02]"
                        >
                            <Eye size={17} />
                            View Resume
                        </button>
                    </div>

                    <p className="flex items-center gap-2 text-xs text-cyan-300">
                        <Sparkles size={14} />
                        AI ranked dynamically
                    </p>
                </div>
            </div>
        </div>
    );
}