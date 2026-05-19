import {
    Eye,
    Sparkles,
    Target,
    CheckCircle2,
    AlertCircle,
    Mail,
    Brain,
} from "lucide-react";

function getScoreStyle(score) {
    if (score >= 85) return "text-emerald-300";
    if (score >= 70) return "text-cyan-300";
    if (score >= 50) return "text-orange-300";
    return "text-red-300";
}

export default function CandidateRankingCard({ candidate, rank }) {
    const name =
        candidate.name ||
        candidate.candidateName ||
        candidate.fullName ||
        "Unknown Candidate";

    const email =
        candidate.email ||
        candidate.candidateEmail ||
        "Email not available";

    const role =
        candidate.role ||
        candidate.detectedRole ||
        candidate.currentRole ||
        "Candidate";

    const jobTitle = candidate.jobTitle || "Unknown Job";
    const score = Number(candidate.matchScore || candidate.score || 0);

    const skills = Array.isArray(candidate.skills)
        ? candidate.skills
        : typeof candidate.skills === "string"
        ? candidate.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
        : [];

    const matchedSkills = Array.isArray(candidate.matchedSkills)
        ? candidate.matchedSkills
        : [];

    const missingSkills = Array.isArray(candidate.missingSkills)
        ? candidate.missingSkills
        : [];

    return (
        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-5 transition hover:border-orange-400/30">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-400/30 bg-orange-500/10 text-lg font-black text-orange-300">
                        #{rank}
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-black text-white">{name}</h3>

                            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-300">
                                {candidate.recommendation || candidate.aiStatus || "Needs Review"}
                            </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-400">{role}</p>

                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                            <Mail size={14} />
                            {email}
                        </p>

                        <p className="mt-3 text-sm text-slate-400">
                            Ranked for{" "}
                            <span className="font-bold text-orange-200">{jobTitle}</span>
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
                                    Matched
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
                                    Missing
                                </p>
                                <p className="text-xs leading-relaxed text-slate-300">
                                    {missingSkills.length
                                        ? missingSkills.join(", ")
                                        : "No major missing skills"}
                                </p>
                            </div>
                        </div>

                        {candidate.aiInsights && (
                            <p className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-sm leading-relaxed text-slate-300">
                                {candidate.aiInsights}
                            </p>
                        )}

                        <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-cyan-300">
                            <Sparkles size={14} />
                            Ranked dynamically by Groq/Gemini fallback engine
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 flex-col gap-3 xl:w-[210px] xl:items-end">
                    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-center">
                        <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                            <Target size={14} />
                            AI Match
                        </p>

                        <p className={`mt-2 text-4xl font-black ${getScoreStyle(score)}`}>
                            {score}%
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            {candidate.aiStatus || "AI Reviewed"}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 via-cyan-400 to-blue-500 px-5 py-2.5 font-black text-slate-950 transition hover:scale-[1.02]"
                    >
                        <Eye size={17} />
                        View Profile
                    </button>

                    <p className="flex items-center gap-2 text-xs text-orange-300">
                        <Brain size={14} />
                        AI hiring intelligence
                    </p>
                </div>
            </div>
        </div>
    );
}